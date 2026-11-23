
"use server";

import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { idSchema } from "@/features/ordenes/schemas";
import { guardarRespuestaPresupuesto } from "./respuestas";

const respuestaSchema = z.object({
  presupuestoId: idSchema,
  decision: z.enum(["APROBAR", "RECHAZAR"]),
});

const webSchema = respuestaSchema.extend({ codigoCliente: z.string().min(1).max(128) });
const tiendaSchema = respuestaSchema.extend({ ordenId: idSchema });

export async function responderPresupuestoWeb(solicitud: z.infer<typeof webSchema>) {
  const respuesta = webSchema.safeParse(solicitud);
  if (!respuesta.success) return { error: "La solicitud de respuesta no es válida." };

  const { codigoCliente, presupuestoId, decision } = respuesta.data;
  try {
    return await guardarRespuestaPresupuesto({ canal: "WEB", codigoCliente }, presupuestoId, decision);
  } catch (error) {
    console.error("Error al registrar respuesta web:", error);
    return { error: "No se pudo confirmar tu respuesta. Inténtalo nuevamente." };
  }
}

export async function responderPresupuestoEnTienda(solicitud: z.infer<typeof tiendaSchema>) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) return { error: "Tu usuario no tiene permiso para registrar respuestas en tienda." };

  const respuesta = tiendaSchema.safeParse(solicitud);
  if (!respuesta.success) return { error: "La solicitud de respuesta no es válida." };

  const { ordenId, presupuestoId, decision } = respuesta.data;
  try {
    return await guardarRespuestaPresupuesto({ canal: "EN_TIENDA", ordenId }, presupuestoId, decision);
  } catch (error) {
    console.error("Error al registrar respuesta en tienda:", error);
    return { error: "No se pudo confirmar la respuesta del cliente. Inténtalo nuevamente." };
  }
}
