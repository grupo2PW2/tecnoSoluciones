
"use server";

import { revalidatePath } from "next/cache";
import { idSchema } from "@/features/ordenes/schemas";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";
import { crearServicioCatalogo, editarServicioCatalogo, errorAltaServicio, validarAltaServicio, validarEdicionServicio } from "./alta";

function actualizarCatalogo() {
  revalidatePath("/servicios");
  revalidatePath("/ordenes/[id]", "page");
}

export async function registrarServicio(formulario: FormData) {
  const usuario = await getCurrentUser();
  if (usuario?.rol !== "ADMINISTRADOR") return { error: "Solo Administración puede registrar servicios desde el catálogo." };

  const validado = validarAltaServicio(formulario);
  if (!validado.success) return { error: validado.error.issues[0].message };

  try {
    await crearServicioCatalogo(db, validado.data);
    actualizarCatalogo();
    return { guardado: true };
  } catch (error) {
    return errorAltaServicio(validado.data.nombre, error);
  }
}

export async function actualizarServicio(id: number, formulario: FormData) {
  const usuario = await getCurrentUser();
  if (usuario?.rol !== "ADMINISTRADOR") return { error: "Solo Administración puede editar servicios desde el catálogo." };

  const servicioId = idSchema.safeParse(id);
  if (!servicioId.success) return { error: "El servicio seleccionado no es válido." };
  const validado = validarEdicionServicio(formulario);
  if (!validado.success) return { error: validado.error.issues[0].message };

  try {
    const resultado = await editarServicioCatalogo(servicioId.data, validado.data);
    if ("guardado" in resultado) actualizarCatalogo();
    return resultado;
  } catch (error) {
    return errorAltaServicio(validado.data.nombre, error, servicioId.data);
  }
}
