"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { puedeRegistrarIngreso, puedeTomarOrdenes } from "@/features/ordenes/modelo";
import { idSchema } from "@/features/ordenes/schemas";
import { retirarOferta } from "./retiro";

const retiroSchema = z.object({ ordenId: idSchema, presupuestoId: idSchema });

export async function retirarPresupuesto(solicitud: z.infer<typeof retiroSchema>) {
  const usuario = await getCurrentUser();
  if (!usuario || (!puedeRegistrarIngreso(usuario.rol) && !puedeTomarOrdenes(usuario.rol))) {
    return { error: "Tu usuario no tiene permiso para retirar esta oferta." };
  }

  const resultado = retiroSchema.safeParse(solicitud);
  if (!resultado.success) return { error: "Selecciona una versión de presupuesto válida." };

  try {
    const { ordenId, presupuestoId } = resultado.data;
    return await retirarOferta(ordenId, presupuestoId, puedeTomarOrdenes(usuario.rol) ? usuario.id : undefined);
  } catch (error) {
    console.error("Error al retirar el presupuesto:", error);
    return { error: "No se pudo confirmar el retiro. Inténtalo nuevamente." };
  }
}
