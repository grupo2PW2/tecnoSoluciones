
"use server";

import { getCurrentUser } from "@/lib/auth";
import { actualizarDiagnostico } from "./diagnostico";
import { puedeTomarOrdenes } from "./modelo";
import { diagnosticoSchema, type SolicitudDiagnostico } from "./schemas";

export async function guardarDiagnostico(solicitud: SolicitudDiagnostico) {
  const usuario = await getCurrentUser();
  if (!usuario || !puedeTomarOrdenes(usuario.rol)) {
    return { error: "Tu usuario no tiene permiso para registrar diagnósticos." };
  }

  const resultado = diagnosticoSchema.safeParse(solicitud);
  if (!resultado.success) return { error: resultado.error.issues[0].message };

  const datos = resultado.data;
  try {
    return await actualizarDiagnostico(datos.ordenId, usuario.id, datos.operacion,
      datos.operacion === "iniciar" ? "" : datos.hallazgos);
  } catch (error) {
    console.error("Error al guardar diagnóstico:", error);
    return { error: "No se pudo guardar el diagnóstico. Inténtalo nuevamente." };
  }
}
