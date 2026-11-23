import { z } from "zod";
import { maxUnidadesInventario } from "@/features/inventario/modelo";
import { modosEstadoRepuesto } from "./modelo";

export const altaRepuestoSchema = z.object({
  sku: z.string().trim().min(1, "Indica el código del repuesto.").max(64),
  nombre: z.string().trim().min(1, "Indica el nombre del repuesto.").max(120),
  unidadesCaja: z.string().regex(/^\d+$/, "Indica cuántas unidades contiene cada caja.")
    .transform(Number).pipe(z.number().int().min(0).max(maxUnidadesInventario, "Las unidades por caja superan el límite permitido.")),
});

export const edicionRepuestoSchema = altaRepuestoSchema.extend({ modoEstado: z.enum(modosEstadoRepuesto) });

export type DatosEdicionRepuesto = z.infer<typeof edicionRepuestoSchema>;
export type DatosAltaRepuesto = z.infer<typeof altaRepuestoSchema>;
