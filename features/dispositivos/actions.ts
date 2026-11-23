
"use server";

import { z } from "zod";
import { eliminarImagen, prepararImagen } from "@/features/imagenes/blob";
import { esReferenciaImagen } from "@/features/imagenes/modelo";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { idSchema } from "@/features/ordenes/schemas";
import { tiposDispositivo } from "./modelo";

const dispositivoSchema = z.object({
  clienteId: idSchema,
  tipo: z.enum(Object.keys(tiposDispositivo) as (keyof typeof tiposDispositivo)[]),
  marca: z.string().trim().min(1, "Escribe la marca.").max(100),
  modelo: z.string().trim().min(1, "Escribe el modelo.").max(100),
  nroSerie: z.string().trim().max(100),
});

function validarEquipo(clienteId: number, formData: FormData) {
  return dispositivoSchema.safeParse({
    clienteId,
    tipo: formData.get("tipo"),
    marca: formData.get("marca"),
    modelo: formData.get("modelo"),
    nroSerie: formData.get("nroSerie") ?? "",
  });
}

function actualizarVistas(clienteId: number) {
  revalidatePath("/clientes/" + clienteId);
  revalidatePath("/dispositivos");
}

export async function crearDispositivo(clienteId: number, formData: FormData) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) {
    return { error: "Tu usuario no tiene permiso para registrar equipos." };
  }

  const resultado = validarEquipo(clienteId, formData);
  if (!resultado.success) return { error: resultado.error.issues[0].message };

  const { nroSerie, ...datos } = resultado.data;
  let imagenNueva: string | undefined;
  try {
    const cliente = await db.orm.public.Clientes.select("id").first({ id: clienteId });
    if (!cliente) return { error: "Selecciona un cliente que esté registrado." };
    const imagen = await prepararImagen("dispositivos", formData);
    if ("error" in imagen) return imagen;
    imagenNueva = imagen.nueva;

    const dispositivo = await db.orm.public.Dispositivos
      .select("id", "marca", "modelo", "nroSerie")
      .create({ ...datos, nroSerie: nroSerie || null, ...(imagenNueva && { imgUrl: imagenNueva }) });
    actualizarVistas(clienteId);
    return { dispositivo };
  } catch (error) {
    if (imagenNueva) await limpiarImagenSinReferencia(imagenNueva);
    return errorGuardarEquipo(error, nroSerie);
  }
}

export async function actualizarDispositivo(id: number, clienteId: number, formulario: FormData) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) return { error: "Tu usuario no tiene permiso para editar equipos." };

  const dispositivoId = idSchema.safeParse(id);
  if (!dispositivoId.success) return { error: "Selecciona un equipo válido." };
  const validado = validarEquipo(clienteId, formulario);
  if (!validado.success) return { error: validado.error.issues[0].message };

  const { nroSerie, tipo, marca, modelo } = validado.data;
  let imagenNueva: string | undefined;
  try {
    const imagen = await prepararImagen("dispositivos", formulario);
    if ("error" in imagen) return imagen;
    imagenNueva = imagen.nueva;

    const dispositivo = await db.transaction(async (tx) => {
      const equipo = await tx.orm.public.Dispositivos.where({ id: dispositivoId.data, clienteId: validado.data.clienteId })
        .select("id", "imgUrl").forNoKeyUpdate().first();
      if (!equipo) return null;
      await tx.orm.public.Dispositivos.where({ id: equipo.id }).update({
        tipo, marca, modelo, nroSerie: nroSerie || null,
        ...(imagen.referencia !== undefined && { imgUrl: imagen.referencia }),
      });
      return equipo;
    });
    if (!dispositivo) {
      if (imagenNueva) await eliminarImagen(imagenNueva);
      return { error: "El equipo ya no está registrado para este cliente." };
    }
    if (imagen.referencia !== undefined && esReferenciaImagen("dispositivos", dispositivo.imgUrl)) {
      await eliminarImagen(dispositivo.imgUrl);
    }
    actualizarVistas(clienteId);
    return { dispositivo: { id: dispositivo.id } };
  } catch (error) {
    if (imagenNueva) await limpiarImagenSinReferencia(imagenNueva);
    return errorGuardarEquipo(error, nroSerie, dispositivoId.data);
  }
}

async function limpiarImagenSinReferencia(imgUrl: string) {
  const utilizada = await db.orm.public.Dispositivos.select("id").first({ imgUrl }).catch(() => undefined);
  if (utilizada === null) await eliminarImagen(imgUrl);
}

async function errorGuardarEquipo(error: unknown, nroSerie: string, id?: number) {
  if (nroSerie) {
    const existente = await db.orm.public.Dispositivos.select("id").first({ nroSerie }).catch(() => null);
    if (existente && existente.id !== id) {
      return { error: "Ya existe un equipo con ese número de serie. Busca el equipo o verifica el número." };
    }
  }
  console.error("Error al guardar equipo:", error);
  return { error: "No se pudo guardar el equipo. Inténtalo de nuevo." };
}
