import { z } from "zod";
import { idSchema } from "@/features/ordenes/schemas";
import { maxUnidadesInventario } from "./modelo";

const entero = z.number().int().min(0, "Usa cantidades enteras de cero o más.").max(maxUnidadesInventario);

export const stockMinimoSchema = z.object({
  repuestoId: idSchema,
  cajas: entero,
  unidades: entero,
  unidadesCaja: z.number().int().max(maxUnidadesInventario),
});

export type DatosStockMinimo = z.infer<typeof stockMinimoSchema>;
