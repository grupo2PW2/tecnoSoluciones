"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { actualizarStockMinimo } from "./stock-minimo";
import { stockMinimoSchema, type DatosStockMinimo } from "./schemas";

export async function guardarStockMinimo(solicitud: DatosStockMinimo) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) return { error: "Tu usuario no tiene permiso para editar el stock mínimo." };

  const validado = stockMinimoSchema.safeParse(solicitud);
  if (!validado.success) return { error: "Indica cantidades enteras de cero o más dentro del rango permitido." };

  try {
    const resultado = await actualizarStockMinimo(validado.data);
    if ("guardado" in resultado) revalidatePath("/inventario");
    return resultado;
  } catch (error) {
    console.error("Error al guardar el stock mínimo:", error);
    return { error: "No se pudo guardar el stock mínimo. Inténtalo nuevamente." };
  }
}
