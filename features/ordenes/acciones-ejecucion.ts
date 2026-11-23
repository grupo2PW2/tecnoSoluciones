
"use server";

import { getCurrentUser } from "@/lib/auth";
import { registrarEjecucion } from "./ejecucion";
import { ejecucionSchema, type SolicitudEjecucion } from "./ejecucion-schemas";
import { puedeTomarOrdenes } from "./modelo";

export async function guardarTrabajoTecnico(solicitud: SolicitudEjecucion) {
  const usuario = await getCurrentUser();
  if (!usuario || !puedeTomarOrdenes(usuario.rol)) {
    return { error: "Tu usuario no tiene permiso para registrar trabajo técnico." };
  }

  const validada = ejecucionSchema.safeParse(solicitud);
  if (!validada.success) return { error: validada.error.issues[0].message };

  try {
    return await registrarEjecucion(validada.data, usuario.id);
  } catch (error) {
    console.error("Error al guardar el trabajo técnico:", error);
    return { error: "No se pudo guardar el trabajo. Inténtalo nuevamente." };
  }
}
