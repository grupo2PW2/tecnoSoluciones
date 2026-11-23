
"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { confirmarCancelacionOrden } from "./cancelacion";
import { puedeRegistrarIngreso } from "./modelo";
import { idSchema } from "./schemas";

const cancelacionSchema = z.object({
  ordenId: idSchema,
  motivo: z.string().trim().min(1, "Escribe el motivo de cancelación.").max(1000),
});

export async function cancelarOrden(solicitud: z.infer<typeof cancelacionSchema>) {
  const usuario = await getCurrentUser();
  if (!usuario || !puedeRegistrarIngreso(usuario.rol)) {
    return { error: "Tu usuario no tiene permiso para cancelar órdenes." };
  }

  const validada = cancelacionSchema.safeParse(solicitud);
  if (!validada.success) return { error: validada.error.issues[0].message };

  try {
    return await confirmarCancelacionOrden(validada.data.ordenId, validada.data.motivo);
  } catch (error) {
    console.error("Error al cancelar la orden:", error);
    return { error: "No se pudo confirmar la cancelación. Inténtalo nuevamente." };
  }
}
