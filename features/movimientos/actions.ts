"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { crearEntrada } from "./entradas";
import { crearSalida } from "./salidas";
import { entradaSchema, salidaSchema, ventaSchema, type DatosEntrada, type DatosSalida, type DatosVenta } from "./schemas";

export async function guardarEntrada(solicitud: DatosEntrada) {
  const usuario = await getCurrentUser();
  if (!usuario || !puedeRegistrarIngreso(usuario.rol)) {
    return { error: "Tu usuario no tiene permiso para registrar entradas de stock." };
  }
  const validado = entradaSchema.safeParse(solicitud);
  if (!validado.success) return { error: validado.error.issues[0].message };

  try {
    const resultado = await crearEntrada(validado.data, usuario.id);
    if ("registrada" in resultado) {
      revalidatePath("/inventario");
      revalidatePath("/repuestos");
    }
    return resultado;
  } catch (error) {
    console.error("Error al registrar entrada de stock:", error);
    return { error: "No se pudo registrar la entrada. Inténtalo nuevamente." };
  }
}

export async function guardarSalida(solicitud: DatosSalida) {
  const usuario = await getCurrentUser();
  if (!usuario || !puedeRegistrarIngreso(usuario.rol)) {
    return { error: "Tu usuario no tiene permiso para registrar salidas de stock." };
  }
  const validado = salidaSchema.safeParse(solicitud);
  if (!validado.success) return { error: validado.error.issues[0].message };

  try {
    const resultado = await crearSalida(validado.data, usuario.id);
    if ("registrada" in resultado) {
      revalidatePath("/inventario");
      revalidatePath("/repuestos");
    }
    return resultado;
  } catch (error) {
    console.error("Error al registrar la salida de stock:", error);
    return { error: "No se pudo registrar la salida. Inténtalo nuevamente." };
  }
}


export async function guardarVenta(solicitud: DatosVenta) {
  const usuario = await getCurrentUser();
  if (!usuario || !puedeRegistrarIngreso(usuario.rol)) {
    return { error: "Tu usuario no tiene permiso para registrar ventas." };
  }
  const validado = ventaSchema.safeParse(solicitud);
  if (!validado.success) return { error: validado.error.issues[0].message };

  try {
    const resultado = await crearSalida(validado.data, usuario.id, "SALIDA_VENTA");
    if ("registrada" in resultado) {
      revalidatePath("/inventario");
      revalidatePath("/repuestos");
    }
    return resultado;
  } catch (error) {
    console.error("Error al registrar venta de repuestos:", error);
    return { error: "No se pudo registrar la venta. Inténtalo nuevamente." };
  }
}
