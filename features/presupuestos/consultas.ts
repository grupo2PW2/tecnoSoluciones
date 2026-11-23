
import "server-only";

import { db } from "@/src/prisma/db";
import { nombreDiagnosticoGeneral } from "@/features/ordenes/diagnostico-general";
import { fechaBolivia } from "./fechas";
import type { DetallePresupuesto } from "./modelo";
import { marcarOfertaVencida } from "./vencimiento";

function consultarPresupuestosPrincipales(tx: Pick<typeof db, "orm">, ordenId: number) {
  return tx.orm.public.Presupuestos.where({ ordenId, tipo: "PRINCIPAL" })
    .select("id", "version", "estado", "prioridad", "fechaEstimadaEntrega", "fechaVencimiento",
      "fechaPresentacion", "fechaRespuesta", "canalRespuesta", "observaciones",
      "porcentajeRecargo", "montoRecargo", "descuentoDiagnostico", "total")
    .include("presupuestoServicios", (lineas) => lineas.select("servicioId", "cantidad", "precioUnitario", "estado", "trabajoVerificado",
      "fechaInicio", "fechaFinalizacion", "observaciones")
      .include("servicio", (servicio) => servicio.select("nombre")).orderBy((linea) => linea.servicioId.asc()))
    .include("presupuestoRepuestos", (lineas) => lineas.select("repuestoId", "cantidad", "precioUnitario")
      .include("repuesto", (repuesto) => repuesto.select("nombre", "precioVenta")).orderBy((linea) => linea.repuestoId.asc()))
    .orderBy((presupuesto) => presupuesto.version.desc());
}

export function buscarPresupuestoPrincipal(tx: Pick<typeof db, "orm">, ordenId: number) {
  return consultarPresupuestosPrincipales(tx, ordenId).first();
}

export async function siguienteVersionPresupuesto(tx: Pick<typeof db, "orm">, ordenId: number) {
  const ultima = await tx.orm.public.Presupuestos.where({ ordenId })
    .select("version").orderBy((presupuesto) => presupuesto.version.desc()).first();
  return (ultima?.version ?? 0) + 1;
}

export async function obtenerHistorialPresupuestos(ordenId: number, versionActual: number) {
  const anteriores = await consultarPresupuestosPrincipales(db, ordenId)
    .where((presupuesto) => presupuesto.version.lt(versionActual))
    .where((presupuesto) => presupuesto.estado.neq("BORRADOR"))
    .all();
  return anteriores.map(prepararDetallePresupuesto);
}

type RegistroPresupuesto = NonNullable<Awaited<ReturnType<typeof buscarPresupuestoPrincipal>>>;

export function partidaDiagnostico(registro: RegistroPresupuesto) {
  return registro.presupuestoServicios.find((linea) => linea.servicio?.nombre === nombreDiagnosticoGeneral);
}

export function prepararDetallePresupuesto(registro: RegistroPresupuesto): DetallePresupuesto {
  const diagnostico = partidaDiagnostico(registro);
  return {
    id: registro.id,
    version: registro.version,
    estado: registro.estado,
    prioridad: registro.prioridad,
    fechaEstimada: registro.fechaEstimadaEntrega ? fechaBolivia(registro.fechaEstimadaEntrega) : null,
    fechaVencimiento: registro.fechaVencimiento ? fechaBolivia(registro.fechaVencimiento) : null,
    fechaPresentacion: registro.fechaPresentacion ? fechaBolivia(registro.fechaPresentacion) : null,
    venceEn: registro.fechaVencimiento?.toISOString() ?? null,
    fechaRespuesta: registro.fechaRespuesta?.toISOString() ?? null,
    canalRespuesta: registro.canalRespuesta,
    observaciones: registro.observaciones ?? "",
    diagnostico: diagnostico ? {
      id: diagnostico.servicioId, nombre: nombreDiagnosticoGeneral,
      cantidad: diagnostico.cantidad, precioUnitario: diagnostico.precioUnitario,
    } : null,
    servicios: registro.presupuestoServicios.filter((linea) => linea.servicioId !== diagnostico?.servicioId)
      .map((linea) => ({
        id: linea.servicioId, nombre: linea.servicio?.nombre ?? "Servicio",
        cantidad: linea.cantidad, precioUnitario: linea.precioUnitario,
      })),
    repuestos: registro.presupuestoRepuestos.map((linea) => ({
      id: linea.repuestoId, nombre: linea.repuesto?.nombre ?? "Repuesto",
      cantidad: linea.cantidad, precioUnitario: linea.precioUnitario,
    })),
    porcentajeRecargo: registro.porcentajeRecargo,
    montoRecargo: registro.montoRecargo,
    descuentoDiagnostico: registro.descuentoDiagnostico,
    total: registro.total,
  };
}

export async function tienePrincipalAprobado(tx: Pick<typeof db, "orm">, ordenId: number) {
  return Boolean(await tx.orm.public.Presupuestos
    .select("id").first({ ordenId, tipo: "PRINCIPAL", estado: "APROBADO" }));
}

export function obtenerOrdenParaConsulta(ordenId: number) {
  return db.orm.public.Orden.select("id", "codigo", "estado", "fechaEntregaCliente", "entregadoPorId", "montoCobrado",
    "fechaCierreTecnico", "motivoCancelacion", "tipoIngreso", "problemasReportados", "tecnicoId")
    .include("tecnicoResponsable", (usuario) => usuario.select("nombre", "apellido"))
    .include("entregadoPor", (usuario) => usuario.select("nombre", "apellido"))
    .include("dispositivo", (equipo) => equipo.select("marca", "modelo"))
    .first({ id: ordenId });
}

export async function obtenerPresupuestoOrden(ordenId: number, ahora: Date) {
  const registro = await buscarPresupuestoPrincipal(db, ordenId);
  if (!registro) return null;

  if (registro.estado === "PENDIENTE_APROBACION" && registro.fechaVencimiento && registro.fechaVencimiento <= ahora) {
    await marcarOfertaVencida(db, registro.id, ahora);
    const actual = await buscarPresupuestoPrincipal(db, ordenId);
    return actual ? prepararDetallePresupuesto(actual) : null;
  }

  return prepararDetallePresupuesto(registro);
}
