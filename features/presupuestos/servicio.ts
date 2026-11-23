
import "server-only";

import { db } from "@/src/prisma/db";
import { nombreDiagnosticoGeneral } from "@/features/ordenes/diagnostico-general";
import { buscarPresupuestoPrincipal, partidaDiagnostico, siguienteVersionPresupuesto, tienePrincipalAprobado } from "./consultas";
import { fechaBolivia, fechaEstimadaLocal, vencimientoLocal } from "./fechas";
import { bloquearOrdenParaCotizar, type Cotizador } from "./permisos-cotizacion";
import { consultarRepuestosParaGuardar } from "./repuestos";
import { aplicarRespuesta } from "./respuestas";
import { calcularPresupuesto } from "./importes";
import type { OpcionServicio } from "./modelo";
import type { SolicitudPresupuesto } from "./schemas";
import { crearServicioCatalogo, validarAltaServicio, errorAltaServicio } from "@/features/servicios/alta";

export function listarServiciosCotizables(): Promise<OpcionServicio[]> {
  return db.orm.public.Servicios.where({ activo: true })
    .where((servicio) => servicio.nombre.neq(nombreDiagnosticoGeneral))
    .select("id", "nombre", "precioReferencial")
    .orderBy((servicio) => servicio.nombre.asc())
    .all()
    .then((servicios) => servicios.map((servicio) => ({
      id: servicio.id, nombre: servicio.nombre, precioUnitario: servicio.precioReferencial,
    })));
}

async function validarCotizacion(
  tx: Pick<typeof db, "orm">, ordenId: number, presupuestoId: number, cotizador: Cotizador,
) {
  const acceso = await bloquearOrdenParaCotizar(tx, ordenId, cotizador);
  if (!acceso.ok) return { error: acceso.error };
  const { orden } = acceso;
  const estadoInicial = orden.tipoIngreso === "SERVICIO_DIRECTO" ? "RECIBIDO" : "EN_DIAGNOSTICO";
  if (orden.fechaCierreTecnico || (orden.estado !== estadoInicial && orden.estado !== "PENDIENTE_APROBACION")) {
    return { error: "Esta orden no está disponible para cotizar el trabajo." };
  }

  const registro = await buscarPresupuestoPrincipal(tx, orden.id);
  if (!registro || registro.id !== presupuestoId) {
    return { error: "La versión actual cambió. Vuelve a abrir el presupuesto." };
  }
  if (registro.estado !== "BORRADOR") {
    return { error: "La versión ya no está en borrador. Vuelve a abrir el presupuesto." };
  }

  if (orden.estado === "PENDIENTE_APROBACION") {
    const anterior = await tx.orm.public.Presupuestos.where({ ordenId, tipo: "PRINCIPAL" })
      .where((presupuesto) => presupuesto.version.lt(registro.version))
      .select("estado", "fechaPresentacion", "fechaRespuesta").orderBy((presupuesto) => presupuesto.version.desc()).first();
    const puedeVersionar = anterior?.estado === "VENCIDO" ||
      (anterior?.estado === "CANCELADO" && anterior.fechaPresentacion && !anterior.fechaRespuesta);
    if (!puedeVersionar || await tienePrincipalAprobado(tx, orden.id)) {
      return { error: "Este borrador debe corresponder a una oferta vencida o retirada sin respuesta." };
    }
  }

  const diagnostico = partidaDiagnostico(registro);
  if (orden.tipoIngreso === "DIAGNOSTICO" && (!diagnostico || diagnostico.estado !== "FINALIZADO" || !diagnostico.trabajoVerificado)) {
    return { error: "Finaliza y verifica el diagnóstico antes de cotizar." };
  }
  if (orden.tipoIngreso === "SERVICIO_DIRECTO" && diagnostico) {
    return { error: "Esta cotización contiene una partida de diagnóstico que debe revisarse." };
  }
  if (registro.presupuestoServicios.some((linea) =>
    linea.servicioId !== diagnostico?.servicioId && linea.estado !== "PRESUPUESTADO")) {
    return { error: "La cotización contiene partidas con trabajo registrado." };
  }

  return { orden, registro, diagnostico };
}

export async function crearBorradorDirecto(ordenId: number): Promise<{ creado: true } | { error: string }> {
  return db.transaction(async (tx) => {
    const acceso = await bloquearOrdenParaCotizar(tx, ordenId, { tipo: "recepcion" });
    if (!acceso.ok) return { error: acceso.error };
    const { orden } = acceso;
    if (orden.estado !== "RECIBIDO" || orden.fechaCierreTecnico) {
      return { error: "Solo puedes iniciar un presupuesto directo en una orden recibida." };
    }

    const existente = await buscarPresupuestoPrincipal(tx, orden.id);
    if (existente) {
      return existente.estado === "BORRADOR" ? { creado: true }
        : { error: "La orden ya tiene un presupuesto. Revisa la última versión." };
    }

    const version = await siguienteVersionPresupuesto(tx, orden.id);
    await tx.orm.public.Presupuestos.create({ ordenId: orden.id, version });
    return { creado: true };
  });
}

export async function registrarServicioEnCotizacion(
  ordenId: number, presupuestoId: number, tecnicoId: number, formulario: FormData,
) {
  const validado = validarAltaServicio(formulario);
  if (!validado.success) return { error: validado.error.issues[0].message };

  try {
    return await db.transaction(async (tx) => {
      const cotizacion = await validarCotizacion(tx, ordenId, presupuestoId, { tipo: "tecnico", id: tecnicoId });
      if ("error" in cotizacion) return { error: cotizacion.error ?? "El presupuesto ya no admite cambios." };

      const servicio = await crearServicioCatalogo(tx, validado.data);
      return { opcion: { id: servicio.id, nombre: servicio.nombre, precioUnitario: servicio.precioReferencial } };
    });
  } catch (error) {
    return errorAltaServicio(validado.data.nombre, error);
  }
}

export async function guardarCotizacion(datos: SolicitudPresupuesto, cotizador: Cotizador) {
  return db.transaction(async (tx): Promise<{ guardado: true } | { error: string; actualizarCatalogo?: true }> => {
    const cotizacion = await validarCotizacion(tx, datos.ordenId, datos.presupuestoId, cotizador);
    if ("error" in cotizacion) return { error: cotizacion.error ?? "El presupuesto ya no admite cambios." };
    const { orden, registro, diagnostico } = cotizacion;
    const servicioDirecto = orden.tipoIngreso === "SERVICIO_DIRECTO";
    if (Boolean(datos.aceptadoEnTienda) !== (datos.presentar && servicioDirecto)) {
      return { error: servicioDirecto ? "Confirma la aceptación del cliente en tienda para registrar el presupuesto."
        : "El cliente debe aprobar este presupuesto desde el enlace del ticket." };
    }

    const ahora = new Date();
    const hoy = fechaBolivia(ahora);
    if (datos.presentar) {
      if (!datos.servicios.length) {
        return { error: "Agrega al menos un servicio antes de presentar." };
      }
      if (!datos.fechaEstimada || (!servicioDirecto && !datos.fechaVencimiento)) {
        return { error: servicioDirecto ? "Indica la fecha estimada de entrega."
          : "Indica la fecha estimada de entrega y la fecha de vencimiento." };
      }
      if (datos.fechaEstimada < hoy || (!servicioDirecto && datos.fechaVencimiento && datos.fechaVencimiento < hoy)) {
        return { error: servicioDirecto ? "La fecha estimada de entrega debe ser de hoy o posterior."
          : "Las fechas de entrega y vencimiento deben ser de hoy o posteriores." };
      }
    }

    const servicios = datos.servicios.length
      ? await tx.orm.public.Servicios
          .where((servicio) => servicio.id.in(datos.servicios.map((partida) => partida.id)))
          .where({ activo: true }).select("id", "nombre", "precioReferencial").forShare().all()
      : [];
    const catalogo = new Map(servicios.map((servicio) => [servicio.id, servicio]));
    const partidasGuardadas = new Map(registro.presupuestoServicios.map((linea) => [linea.servicioId, linea]));

    for (const partida of datos.servicios) {
      const servicio = catalogo.get(partida.id);
      const guardada = partidasGuardadas.get(partida.id);
      if (!servicio || servicio.nombre === nombreDiagnosticoGeneral) {
        const nombre = guardada?.servicio?.nombre;
        return {
          error: nombre ? nombre + " ya no está disponible. Quita esa partida."
            : "Un servicio ya no está disponible. Revisa el catálogo y las partidas seleccionadas.",
          actualizarCatalogo: true,
        };
      }
      const precio = guardada?.precioUnitario ?? servicio.precioReferencial;
      if (precio !== partida.precioUnitario) {
        return {
          error: "Cambió el precio de " + servicio.nombre + ". Vuelve a seleccionarlo antes de guardar.",
          actualizarCatalogo: true,
        };
      }
    }

    const repuestos = await consultarRepuestosParaGuardar(tx, datos.repuestos.map((partida) => partida.id));
    const repuestosGuardados = new Map(registro.presupuestoRepuestos.map((partida) => [partida.repuestoId, partida]));
    for (const partida of datos.repuestos) {
      const repuesto = repuestos.get(partida.id);
      const guardada = repuestosGuardados.get(partida.id);
      const nombre = repuesto?.nombre ?? guardada?.repuesto?.nombre ?? "El repuesto seleccionado";
      if (!repuesto?.disponible) {
        return { error: nombre + " no está disponible para cotizar. Quita esa partida.", actualizarCatalogo: true };
      }
      if (partida.cantidad > repuesto.stock) {
        return {
          error: nombre + " tiene " + repuesto.stock + (repuesto.stock === 1 ? " unidad disponible." : " unidades disponibles.") +
            " Ajusta la cantidad o quita la partida.",
          actualizarCatalogo: true,
        };
      }
      if (partida.precioUnitario !== (guardada?.precioUnitario ?? repuesto.precioUnitario)) {
        return {
          error: "Cambió el precio de " + nombre + ". Vuelve a seleccionarlo antes de guardar.",
          actualizarCatalogo: true,
        };
      }
    }

    const importes = calcularPresupuesto(datos.servicios, datos.repuestos, diagnostico?.precioUnitario ?? "0.00", datos.prioridad);
    if (importes.excedeLimite) return { error: "El total supera el importe permitido para una cotización." };

    const partidas = tx.orm.public.PresupuestoServicio.where({ presupuestoId: registro.id });
    await (diagnostico ? partidas.where((linea) => linea.servicioId.neq(diagnostico.servicioId)) : partidas).deleteAll();
    for (const partida of datos.servicios) {
      await tx.orm.public.PresupuestoServicio.create({
        presupuestoId: registro.id,
        servicioId: partida.id,
        cantidad: partida.cantidad,
        precioUnitario: partida.precioUnitario,
      });
    }

    if (registro.presupuestoRepuestos.length) {
      await tx.orm.public.PresupuestoRepuesto.where({ presupuestoId: registro.id }).deleteAll();
    }
    for (const partida of datos.repuestos) {
      await tx.orm.public.PresupuestoRepuesto.create({
        presupuestoId: registro.id,
        repuestoId: partida.id,
        cantidad: partida.cantidad,
        precioUnitario: partida.precioUnitario,
      });
    }

    await tx.orm.public.Presupuestos.where({ id: registro.id }).update({
      prioridad: datos.prioridad,
      fechaEstimadaEntrega: datos.fechaEstimada ? fechaEstimadaLocal(datos.fechaEstimada) : null,
      fechaVencimiento: !servicioDirecto && datos.fechaVencimiento ? vencimientoLocal(datos.fechaVencimiento) : null,
      observaciones: datos.observaciones || null,
      porcentajeRecargo: String(importes.porcentajeRecargo),
      montoRecargo: importes.montoRecargo,
      descuentoDiagnostico: importes.descuentoDiagnostico,
      ...(datos.presentar && {
        ...(!servicioDirecto && { estado: "PENDIENTE_APROBACION" as const }),
        fechaPresentacion: ahora,
        total: importes.total,
      }),
    });
    if (datos.presentar && servicioDirecto) {
      await aplicarRespuesta(tx, orden.id, registro.id, "APROBAR", "EN_TIENDA", ahora);
    } else if (datos.presentar && orden.estado !== "PENDIENTE_APROBACION") {
      await tx.orm.public.Orden.where({ id: orden.id }).update({ estado: "PENDIENTE_APROBACION" });
    }

    return { guardado: true };
  });
}
