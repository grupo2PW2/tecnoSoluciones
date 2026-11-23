
"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { confirmarEntregaOrden } from "./entrega";
import { puedeRegistrarIngreso } from "./modelo";
import { idSchema } from "./schemas";

const entregaSchema = z.object({
  ordenId: idSchema,
  montoConfirmado: z.string().regex(/^\d{1,8}\.\d{2}$/).nullable(),
});

export async function registrarEntrega(solicitud: z.infer<typeof entregaSchema>) {
  const usuario = await getCurrentUser();
  if (!usuario || !puedeRegistrarIngreso(usuario.rol)) {
    return { error: "Tu usuario no tiene permiso para registrar entregas." };
  }

  const validada = entregaSchema.safeParse(solicitud);
  if (!validada.success) return { error: "Revisa los datos de la entrega antes de confirmar." };

  try {
    return await confirmarEntregaOrden(validada.data.ordenId, usuario.id, validada.data.montoConfirmado);
  } catch (error) {
    console.error("Error al registrar la entrega:", error);
    return { error: "No se pudo confirmar la entrega. Inténtalo nuevamente." };
  }
}
