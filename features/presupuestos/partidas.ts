import "server-only";

import type { db } from "@/src/prisma/db";
import type { partidaDiagnostico } from "./consultas";

export function copiarDiagnostico(
  tx: Pick<typeof db, "orm">, presupuestoId: number, diagnostico: NonNullable<ReturnType<typeof partidaDiagnostico>>,
) {
  return tx.orm.public.PresupuestoServicio.create({
    presupuestoId,
    servicioId: diagnostico.servicioId,
    precioUnitario: diagnostico.precioUnitario,
    cantidad: diagnostico.cantidad,
    estado: diagnostico.estado,
    trabajoVerificado: diagnostico.trabajoVerificado,
    fechaInicio: diagnostico.fechaInicio,
    fechaFinalizacion: diagnostico.fechaFinalizacion,
    observaciones: diagnostico.observaciones,
  });
}
