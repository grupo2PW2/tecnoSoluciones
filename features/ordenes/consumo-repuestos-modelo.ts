import { z } from "zod";
import { idSchema } from "./schemas";

export interface RepuestoAutorizado {
  id: number;
  nombre: string;
  sku: string;
  autorizadas: number;
  utilizadas: number;
  stock: number;
  unidadesCaja: number;
}

const unidades = z.number().int().min(0).max(2147483647);
const lineaConsumoSchema = z.object({
  repuestoId: idSchema,
  registradas: unidades,
  totalUtilizado: unidades,
}).refine((linea) => linea.totalUtilizado > linea.registradas, "El total utilizado debe aumentar al registrar una salida.");

export const consumoRepuestosSchema = z.object({
  ordenId: idSchema,
  partidas: z.array(lineaConsumoSchema).min(1, "Indica las unidades utilizadas.").max(100).refine(
    (lineas) => new Set(lineas.map((linea) => linea.repuestoId)).size === lineas.length,
    "Cada repuesto debe aparecer una sola vez.",
  ),
});

export type SolicitudConsumoRepuestos = z.infer<typeof consumoRepuestosSchema>;
