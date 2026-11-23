"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { cotizadorParaUsuario } from "./permisos-cotizacion";
import { idSchema } from "@/features/ordenes/schemas";
import { crearNuevaVersionPresupuesto } from "./renovacion";

const versionSchema = z.object({ ordenId: idSchema, presupuestoId: idSchema, desdeRetirada: z.boolean().default(false) });

export async function prepararNuevaVersion(solicitud: z.input<typeof versionSchema>) {
  const cotizador = cotizadorParaUsuario(await getCurrentUser());
  if (!cotizador) {
    return { error: "Tu usuario no tiene permiso para preparar otra versión de esta cotización." };
  }
  const validada = versionSchema.safeParse(solicitud);
  if (!validada.success) return { error: "Selecciona una versión de presupuesto válida." };

  try {
    const { ordenId, presupuestoId, desdeRetirada } = validada.data;
    return await crearNuevaVersionPresupuesto(ordenId, presupuestoId, cotizador, desdeRetirada);
  } catch (error) {
    console.error("Error al preparar otra versión del presupuesto:", error);
    return { error: "No se pudo crear el nuevo borrador. Inténtalo nuevamente." };
  }
}
