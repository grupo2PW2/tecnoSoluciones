
import "server-only";

import type { db } from "@/src/prisma/db";

export function marcarOfertaVencida(tx: Pick<typeof db, "orm">, presupuestoId: number, ahora: Date) {
  return tx.orm.public.Presupuestos.where({ id: presupuestoId, estado: "PENDIENTE_APROBACION" })
    .where((presupuesto) => presupuesto.fechaVencimiento.lte(ahora))
    .update({ estado: "VENCIDO" });
}
