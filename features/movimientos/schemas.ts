import { z } from "zod";
import { idSchema } from "@/features/ordenes/schemas";
import { formatoCostoTotal } from "@/features/inventario/precios";
import { maxUnidadesInventario } from "@/features/inventario/modelo";

const entero = z.number().int().min(0, "Usa cantidades enteras de cero o más.").max(maxUnidadesInventario);
const partida = { repuestoId: idSchema, cajas: entero, unidades: entero, unidadesCaja: entero.optional() };
const costoTotal = z.string().trim().regex(formatoCostoTotal, "Escribe el costo total del lote en Bs con hasta dos decimales.")
  .transform((valor) => valor.replace(",", "."));

function partidasUnicas<T extends z.ZodType<{ repuestoId: number }>>(schema: T) {
  return z.array(schema).min(1, "Agrega al menos un repuesto.").max(100).refine(
    (partidas) => new Set(partidas.map(({ repuestoId }) => repuestoId)).size === partidas.length,
    "Agrega cada repuesto una sola vez y registra todas sus unidades en esa línea.",
  );
}

export const entradaSchema = z.object({
  solicitudId: z.uuid(),
  referencia: z.string().trim().max(500),
  partidas: partidasUnicas(z.object({ ...partida, costoTotal })),
});

export const salidaSchema = z.object({
  solicitudId: z.uuid(),
  referencia: z.string().trim().min(1, "Indica el motivo de la salida.").max(500),
  partidas: partidasUnicas(z.object(partida)),
});

export const ventaSchema = z.object({
  solicitudId: z.uuid(),
  referencia: z.string().trim().max(500),
  partidas: partidasUnicas(z.object({
    ...partida,
    precioUnitario: z.string().regex(/^\d{1,8}\.\d{2}$/, "El precio de venta de la partida debe ser válido."),
  })),
});

export type DatosVenta = z.infer<typeof ventaSchema>;
export type DatosSalida = z.infer<typeof salidaSchema>;
export type DatosEntrada = z.infer<typeof entradaSchema>;
