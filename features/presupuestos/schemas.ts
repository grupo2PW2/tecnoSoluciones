
import { z } from "zod";
import { idSchema } from "@/features/ordenes/schemas";

const partidaSchema = z.object({
  id: idSchema,
  cantidad: z.number().int().min(1, "La cantidad debe ser un entero mayor que cero.").max(9999),
  precioUnitario: z.string().regex(/^\d{1,8}(\.\d{1,2})?$/, "El precio de una partida no es válido."),
});

const partidasSchema = z.array(partidaSchema).max(100).refine(
  (partidas) => new Set(partidas.map((partida) => partida.id)).size === partidas.length,
  "Cada partida debe aparecer una sola vez.",
);

export const presupuestoSchema = z.object({
  ordenId: idSchema,
  presupuestoId: idSchema,
  presentar: z.boolean(),
  aceptadoEnTienda: z.boolean().optional(),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA"]),
  fechaEstimada: z.iso.date().nullable(),
  fechaVencimiento: z.iso.date().nullable(),
  observaciones: z.string().trim().max(2000),
  servicios: partidasSchema,
  repuestos: partidasSchema,
});

export type SolicitudPresupuesto = z.infer<typeof presupuestoSchema>;
