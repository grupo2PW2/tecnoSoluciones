
import "server-only";

import { db } from "@/src/prisma/db";
import { buscarPresupuestoPrincipal, partidaDiagnostico, siguienteVersionPresupuesto, tienePrincipalAprobado } from "./consultas";
import { fechaBolivia } from "./fechas";
import { bloquearOrdenParaCotizar, type Cotizador } from "./permisos-cotizacion";
import { copiarDiagnostico } from "./partidas";

export async function crearNuevaVersionPresupuesto(
  ordenId: number, presupuestoId: number, cotizador: Cotizador, desdeRetirada: boolean,
): Promise<{ creada: true } | { error: string }> {
  return db.transaction(async (tx) => {
    const acceso = await bloquearOrdenParaCotizar(tx, ordenId, cotizador);
    if (!acceso.ok) return { error: acceso.error };
    const { orden } = acceso;
    if (orden.estado !== "PENDIENTE_APROBACION" || orden.fechaCierreTecnico) {
      return { error: "Esta orden no está disponible para preparar otra versión del presupuesto." };
    }

    const anterior = await buscarPresupuestoPrincipal(tx, orden.id);
    const estadoEsperado = desdeRetirada ? "CANCELADO" : "VENCIDO";
    if (!anterior || anterior.id !== presupuestoId || anterior.estado !== estadoEsperado ||
      !anterior.fechaPresentacion || anterior.fechaRespuesta) {
      return { error: desdeRetirada ? "Retira la oferta pendiente antes de preparar otra versión."
        : "La versión actual cambió o la oferta aún no venció. Revisa el presupuesto." };
    }
    if (await tienePrincipalAprobado(tx, orden.id)) {
      return { error: "La orden ya tiene un presupuesto principal aprobado." };
    }
    const diagnostico = partidaDiagnostico(anterior);
    if (orden.tipoIngreso === "DIAGNOSTICO" && (!diagnostico || diagnostico.estado !== "FINALIZADO" || !diagnostico.trabajoVerificado)) {
      return { error: "El diagnóstico de la versión anterior debe estar finalizado y verificado." };
    }
    if (orden.tipoIngreso === "SERVICIO_DIRECTO" && diagnostico) {
      return { error: "La versión anterior contiene una partida de diagnóstico que debe revisarse." };
    }
    const reparaciones = anterior.presupuestoServicios.filter((partida) => partida.servicioId !== diagnostico?.servicioId);
    if (reparaciones.some((partida) => partida.estado !== "PRESUPUESTADO")) {
      return { error: "La versión anterior contiene trabajo técnico de reparación registrado." };
    }

    const servicios = reparaciones.length
      ? await tx.orm.public.Servicios.where((servicio) => servicio.id.in(reparaciones.map((partida) => partida.servicioId)))
          .where({ activo: true }).select("id", "precioReferencial").forShare().all()
      : [];
    const precios = new Map(servicios.map((servicio) => [servicio.id, servicio.precioReferencial]));
    const version = await siguienteVersionPresupuesto(tx, ordenId);
    const ahora = new Date();
    const borrador = await tx.orm.public.Presupuestos.select("id").create({
      ordenId,
      version,
      prioridad: anterior.prioridad,
      ...(desdeRetirada && {
        fechaEstimadaEntrega: anterior.fechaEstimadaEntrega && fechaBolivia(anterior.fechaEstimadaEntrega) >= fechaBolivia(ahora)
          ? anterior.fechaEstimadaEntrega : null,
        fechaVencimiento: orden.tipoIngreso === "DIAGNOSTICO" && anterior.fechaVencimiento && anterior.fechaVencimiento > ahora ? anterior.fechaVencimiento : null,
        observaciones: anterior.observaciones,
      }),
    });

    if (diagnostico) await copiarDiagnostico(tx, borrador.id, diagnostico);
    for (const partida of reparaciones) {
      const tarifaVigente = precios.get(partida.servicioId);
      if (tarifaVigente === undefined) continue;
      await tx.orm.public.PresupuestoServicio.create({
        presupuestoId: borrador.id,
        servicioId: partida.servicioId,
        cantidad: partida.cantidad,
        precioUnitario: desdeRetirada ? partida.precioUnitario : tarifaVigente,
      });
    }

    for (const partida of anterior.presupuestoRepuestos) {
      await tx.orm.public.PresupuestoRepuesto.create({
        presupuestoId: borrador.id,
        repuestoId: partida.repuestoId,
        cantidad: partida.cantidad,
        precioUnitario: desdeRetirada ? partida.precioUnitario : partida.repuesto?.precioVenta ?? partida.precioUnitario,
      });
    }

    return { creada: true };
  });
}
