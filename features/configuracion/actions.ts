"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { gananciaValida } from "@/features/inventario/precios";
import { guardarGananciaSobreCosto } from "./ganancia";

const gananciaSchema = z.object({
  margen: z.string().trim().refine(gananciaValida, "Indica un porcentaje entre 0 y 999,99 con hasta dos decimales.")
    .transform((valor) => Number(valor.replace(",", ".")).toFixed(2)),
  esperado: z.string().max(16),
});

export async function guardarGanancia(solicitud: z.input<typeof gananciaSchema>) {
  const usuario = await getCurrentUser();
  if (usuario?.rol !== "ADMINISTRADOR") {
    return { error: "Tu usuario no tiene permiso para cambiar la ganancia global." };
  }
  const validada = gananciaSchema.safeParse(solicitud);
  if (!validada.success) return { error: validada.error.issues[0].message };

  try {
    const resultado = await guardarGananciaSobreCosto(validada.data.margen, validada.data.esperado);
    if (!("error" in resultado)) {
      revalidatePath("/configuracion");
      revalidatePath("/inventario");
      revalidatePath("/movimientos");
      revalidatePath("/repuestos");
    }
    return resultado;
  } catch (error) {
    console.error("Error al actualizar la ganancia sobre el costo:", error);
    return { error: "No se pudo guardar el porcentaje. Inténtalo nuevamente." };
  }
}
