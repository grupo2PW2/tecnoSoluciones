"use server";

import { refresh, revalidatePath } from "next/cache";
import { eliminarImagen, prepararImagen } from "@/features/imagenes/blob";
import { esReferenciaImagen } from "@/features/imagenes/modelo";
import { db } from "@/src/prisma/db";
import { idSchema } from "@/features/ordenes/schemas";
import { getCurrentUser } from "@/lib/auth";
import { cambiarAccesoUsuario, crearUsuario, editarUsuario, errorGuardarUsuario } from "./persistencia";
import { accesoUsuarioSchema, altaUsuarioSchema, edicionUsuarioSchema, leerFichaUsuario, type AccesoUsuario } from "./schemas";

export async function registrarUsuario(formulario: FormData) {
  const autor = await getCurrentUser();
  if (autor?.rol !== "ADMINISTRADOR") return { error: "Solo Administración puede registrar usuarios." };

  const validado = altaUsuarioSchema.safeParse({ ...leerFichaUsuario(formulario), rol: formulario.get("rol") });
  if (!validado.success) return { error: validado.error.issues[0].message };
  let avatarNuevo: string | undefined;
  try {
    const imagen = await prepararImagen("usuarios", formulario);
    if ("error" in imagen) return imagen;
    avatarNuevo = imagen.nueva;
    const resultado = await crearUsuario(autor.id, validado.data, avatarNuevo);
    if ("error" in resultado) {
      if (avatarNuevo) await eliminarImagen(avatarNuevo);
      return resultado;
    }
    revalidatePath("/usuarios");
    return resultado;
  } catch (error) {
    if (avatarNuevo) await limpiarAvatarSinReferencia(avatarNuevo);
    return errorGuardarUsuario(validado.data, error);
  }
}

export async function actualizarUsuario(id: number, formulario: FormData) {
  const autor = await getCurrentUser();
  if (autor?.rol !== "ADMINISTRADOR") return { error: "Solo Administración puede editar usuarios." };
  const usuarioId = idSchema.safeParse(id);
  if (!usuarioId.success) return { error: "Selecciona un usuario válido." };

  const validado = edicionUsuarioSchema.safeParse(leerFichaUsuario(formulario));
  if (!validado.success) return { error: validado.error.issues[0].message };
  let avatarNuevo: string | undefined;
  try {
    const imagen = await prepararImagen("usuarios", formulario);
    if ("error" in imagen) return imagen;
    avatarNuevo = imagen.nueva;
    const resultado = await editarUsuario(autor.id, usuarioId.data, validado.data, imagen.referencia);
    if ("error" in resultado) {
      if (avatarNuevo) await eliminarImagen(avatarNuevo);
      return resultado;
    }
    if (esReferenciaImagen("usuarios", resultado.avatarAnterior)) await eliminarImagen(resultado.avatarAnterior);
    revalidatePath("/usuarios");
    if (autor.id === usuarioId.data && imagen.referencia !== undefined) refresh();
    return { usuario: resultado.usuario };
  } catch (error) {
    if (avatarNuevo) await limpiarAvatarSinReferencia(avatarNuevo);
    return errorGuardarUsuario(validado.data, error, usuarioId.data);
  }
}

async function limpiarAvatarSinReferencia(avatar: string) {
  const utilizado = await db.orm.public.Usuarios.select("id").first({ avatar }).catch(() => undefined);
  if (utilizado === null) await eliminarImagen(avatar);
}

export async function actualizarAccesoUsuario(id: number, formulario: FormData, anterior: AccesoUsuario) {
  const autor = await getCurrentUser();
  if (autor?.rol !== "ADMINISTRADOR") return { error: "Solo Administración puede gestionar el acceso." };
  const usuarioId = idSchema.safeParse(id);
  if (!usuarioId.success) return { error: "Selecciona un usuario válido." };

  const activo = formulario.get("activo");
  const acceso = accesoUsuarioSchema.safeParse({
    rol: formulario.get("rol"),
    activo: activo === "true" ? true : activo === "false" ? false : null,
  });
  const previo = accesoUsuarioSchema.safeParse(anterior);
  if (!acceso.success || !previo.success) return { error: "Selecciona un rol y un estado válidos." };

  try {
    const resultado = await cambiarAccesoUsuario(autor.id, usuarioId.data, acceso.data, previo.data);
    if ("usuario" in resultado) {
      revalidatePath("/usuarios");
      revalidatePath("/ordenes");
    }
    return resultado;
  } catch (error) {
    console.error("Error al guardar el acceso:", error);
    return { error: "No se pudo guardar el acceso. Inténtalo nuevamente." };
  }
}
