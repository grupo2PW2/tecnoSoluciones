"use server";

import { revalidatePath } from "next/cache";
import { eliminarImagen, prepararImagen } from "@/features/imagenes/blob";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { idSchema } from "@/features/ordenes/schemas";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";
import { esImagenRepuesto } from "./imagen";
import { crearRepuesto, editarRepuesto } from "./persistencia";
import { altaRepuestoSchema, edicionRepuestoSchema } from "./schemas";

export async function guardarRepuesto(formulario: FormData, repuestoId?: number) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) return { error: "Tu usuario no tiene permiso para gestionar repuestos." };

  const ficha = {
    sku: formulario.get("sku"),
    nombre: formulario.get("nombre"),
    unidadesCaja: formulario.get("unidadesCaja"),
  };

  const id = repuestoId === undefined ? null : idSchema.safeParse(repuestoId);
  if (id && !id.success) return { error: "El repuesto seleccionado no es válido." };

  const edicion = id?.success
    ? edicionRepuestoSchema.safeParse({ ...ficha, modoEstado: formulario.get("modoEstado") })
    : null;
  const validado = edicion ?? altaRepuestoSchema.safeParse(ficha);
  if (!validado.success) return { error: validado.error.issues[0].message };

  let imagenNueva: string | undefined;
  let imagenAnterior: string | null = null;
  try {
    const imagen = await prepararImagen("repuestos", formulario);
    if ("error" in imagen) return imagen;
    imagenNueva = imagen.nueva;

    const resultado = id?.success && edicion?.success
      ? await editarRepuesto(id.data, edicion.data, imagen.referencia)
      : await crearRepuesto(validado.data, imagenNueva);
    if ("error" in resultado) {
      if (imagenNueva) await eliminarImagen(imagenNueva);
      return resultado;
    }
    if ("imagenAnterior" in resultado) imagenAnterior = resultado.imagenAnterior;
  } catch (error) {
    if (imagenNueva) {
      // Si el guardado quedó confirmado en la base, conserva el archivo aunque falle la respuesta.
      const usada = await db.orm.public.Repuestos.select("id").first({ imgUrl: imagenNueva }).catch(() => undefined);
      if (usada === null) await eliminarImagen(imagenNueva);
    }
    console.error("Error al guardar el repuesto:", error);
    return { error: "No se pudo guardar el repuesto. Inténtalo nuevamente." };
  }

  if (esImagenRepuesto(imagenAnterior)) await eliminarImagen(imagenAnterior);
  revalidatePath("/repuestos");
  revalidatePath("/inventario");
  revalidatePath("/movimientos");
  return { guardado: true };
}
