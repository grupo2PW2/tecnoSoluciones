import "server-only";

import { db } from "@/src/prisma/db";
import { tienePrincipalAprobado } from "./consultas";
import { marcarOfertaVencida } from "./vencimiento";

export async function retirarOferta(
  ordenId: number, presupuestoId: number, tecnicoId?: number,
): Promise<{ retirada: true } | { error: string }> {
  return db.transaction(async (tx) => {
    const orden = await tx.orm.public.Orden.where({ id: ordenId })
      .select("id", "tecnicoId", "estado", "fechaCierreTecnico").forNoKeyUpdate().first();
    if (!orden) return { error: "No se encontró la orden." };
    if (tecnicoId !== undefined && orden.tecnicoId !== tecnicoId) {
      return { error: "La orden no está asignada a tu usuario." };
    }
    if (orden.estado !== "PENDIENTE_APROBACION" || orden.fechaCierreTecnico) {
      return { error: "Solo puedes retirar una oferta pendiente de respuesta." };
    }

    const oferta = await tx.orm.public.Presupuestos.where({ ordenId, tipo: "PRINCIPAL" })
      .select("id", "estado", "fechaPresentacion", "fechaVencimiento", "fechaRespuesta", "total")
      .orderBy((presupuesto) => presupuesto.version.desc()).forNoKeyUpdate().first();
    if (!oferta || oferta.id !== presupuestoId) {
      return { error: "La versión del presupuesto cambió. Revisa la oferta actual." };
    }
    if (oferta.estado !== "PENDIENTE_APROBACION" || !oferta.fechaPresentacion ||
      !oferta.fechaVencimiento || oferta.fechaRespuesta || oferta.total === null ||
      await tienePrincipalAprobado(tx, orden.id)) {
      return { error: "Solo puedes retirar una oferta vigente sin respuesta." };
    }
    const ahora = new Date();
    if (oferta.fechaVencimiento <= ahora) {
      await marcarOfertaVencida(tx, oferta.id, ahora);
      return { error: "La oferta venció. El técnico puede preparar una renovación." };
    }

    await tx.orm.public.Presupuestos.where({ id: oferta.id }).update({ estado: "CANCELADO" });
    return { retirada: true };
  });
}
