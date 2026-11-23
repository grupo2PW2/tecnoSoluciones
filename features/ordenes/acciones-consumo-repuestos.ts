"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { registrarConsumoRepuestos } from "./consumo-repuestos";
import { consumoRepuestosSchema, type SolicitudConsumoRepuestos } from "./consumo-repuestos-modelo";
import { puedeTomarOrdenes } from "./modelo";

export async function guardarConsumoRepuestos(solicitud: SolicitudConsumoRepuestos) {
  const usuario = await getCurrentUser();
  if (!usuario || !puedeTomarOrdenes(usuario.rol)) {
    return { error: "Tu usuario no tiene permiso para registrar repuestos utilizados." };
  }

  const validada = consumoRepuestosSchema.safeParse(solicitud);
  if (!validada.success) return { error: validada.error.issues[0].message };

  try {
    const resultado = await registrarConsumoRepuestos(validada.data, usuario.id);
    if ("registrada" in resultado) {
      revalidatePath("/movimientos");
      revalidatePath("/inventario");
      revalidatePath("/repuestos");
    }
    return resultado;
  } catch (error) {
    console.error("Error al registrar repuestos utilizados:", error);
    return { error: "No se pudo registrar la salida. Inténtalo nuevamente." };
  }
}
