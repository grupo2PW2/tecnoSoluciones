
import "server-only";

import { and, or } from "@prisma/orm-postgres/orm-client";
import { db } from "@/src/prisma/db";
import { nombreDiagnosticoGeneral } from "./diagnostico-general";
import type { EstadoOrden } from "./modelo";

interface OrdenCancelable {
  id: number;
  estado: EstadoOrden;
  fechaCierreTecnico: Date | null;
  fechaEntregaCliente: Date | null;
  entregadoPorId: number | null;
  montoCobrado: string | null;
}

export async function motivoImpedimentoCancelacion(
  orden: OrdenCancelable, tx: Pick<typeof db, "orm"> = db,
): Promise<string | null> {
  if (orden.estado === "CANCELADO") return "La orden ya está cancelada.";
  if (orden.estado === "EN_DIAGNOSTICO") return "El diagnóstico de la orden ya fue iniciado.";
  if (orden.estado === "EN_REPARACION") return "La reparación de la orden ya fue iniciada.";
  if (orden.fechaCierreTecnico || orden.fechaEntregaCliente || orden.entregadoPorId !== null || orden.montoCobrado !== null) {
    return "La orden ya tiene un cierre técnico o datos de entrega.";
  }
  if (orden.estado !== "RECIBIDO" && orden.estado !== "PENDIENTE_APROBACION" && orden.estado !== "APROBADO") {
    return "El estado de la orden no permite cancelarla.";
  }

  const trabajo = await tx.orm.public.PresupuestoServicio.where((partida) => and(
    partida.presupuesto.some((presupuesto) => presupuesto.ordenId.eq(orden.id)),
    or(
      partida.estado.in(["EN_PROCESO", "FINALIZADO"]),
      partida.fechaInicio.isNotNull(),
      partida.fechaFinalizacion.isNotNull(),
      partida.observaciones.neq(""),
      partida.trabajoVerificado.eq(true),
    ),
  ))
    .select("servicioId").include("servicio", (servicio) => servicio.select("nombre"))
    .first();

  if (trabajo?.servicio?.nombre === nombreDiagnosticoGeneral) {
    return orden.estado === "PENDIENTE_APROBACION"
      ? "El diagnóstico ya fue iniciado. Si el cliente decide retirar el equipo, registra el rechazo del presupuesto."
      : "El diagnóstico de la orden ya fue iniciado.";
  }
  if (trabajo) return "Ya hay trabajo técnico registrado para la orden.";

  const repuestoAplicado = await tx.orm.public.Movimientos.where({ ordenId: orden.id, tipo: "SALIDA_REPARACION" })
    .select("id").first();
  return repuestoAplicado ? "La orden ya tiene una salida de repuestos por reparación." : null;
}

export async function confirmarCancelacionOrden(ordenId: number, motivo: string):
Promise<{ cancelada: true } | { error: string }> {
  return db.transaction(async (tx) => {
    const orden = await tx.orm.public.Orden.where({ id: ordenId })
      .select("id", "estado", "fechaCierreTecnico", "fechaEntregaCliente", "entregadoPorId", "montoCobrado")
      .forNoKeyUpdate().first();
    if (!orden) return { error: "No se encontró la orden." };

    const impedimento = await motivoImpedimentoCancelacion(orden, tx);
    if (impedimento) return { error: impedimento };

    const ahora = new Date();
    await tx.orm.public.Presupuestos.where({ ordenId, estado: "PENDIENTE_APROBACION" })
      .where((presupuesto) => presupuesto.fechaVencimiento.lte(ahora)).updateAll({ estado: "VENCIDO" });
    await tx.orm.public.Presupuestos.where({ ordenId })
      .where((presupuesto) => presupuesto.estado.in(["BORRADOR", "PENDIENTE_APROBACION"]))
      .updateAll({ estado: "CANCELADO" });

    await tx.orm.public.Orden.where({ id: ordenId }).update({
      estado: "CANCELADO",
      motivoCancelacion: motivo,
      fechaCierreTecnico: ahora,
    });
    return { cancelada: true };
  });
}
