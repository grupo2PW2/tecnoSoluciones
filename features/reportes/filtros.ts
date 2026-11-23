import { z } from "zod";
import { estadoOrdenSchema } from "@/features/ordenes/schemas";
import { fechaBolivia, fechaEstimadaLocal } from "@/features/presupuestos/fechas";

const diaMs = 86_400_000;
const fechaReporteSchema = z.iso.date({ error: "Indica las dos fechas del periodo." });

export const periodoReporteSchema = z.object({
  desde: fechaReporteSchema,
  hasta: fechaReporteSchema,
}).refine(({ desde, hasta }) => desde <= hasta, { error: "La fecha final debe ser igual o posterior a la inicial." });

export const ordenesReporteSchema = z.object({
  estado: estadoOrdenSchema.or(z.literal("todos")),
  pagina: z.coerce.number().int().min(1).max(2147483647),
});

export type PeriodoReporte = z.infer<typeof periodoReporteSchema>;
export type FiltrosOrdenesReporte = z.infer<typeof ordenesReporteSchema>;

export function periodoInicialReporte(ahora = new Date()): PeriodoReporte {
  const hasta = fechaBolivia(ahora);
  const hoy = fechaEstimadaLocal(hasta);
  return { desde: fechaBolivia(new Date(hoy.getTime() - 29 * diaMs)), hasta };
}

export function limitesReporte({ desde, hasta }: PeriodoReporte) {
  return { inicio: fechaEstimadaLocal(desde), fin: new Date(fechaEstimadaLocal(hasta).getTime() + diaMs) };
}

