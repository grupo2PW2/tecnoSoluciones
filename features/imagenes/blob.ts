import "server-only";

import { del, get, put } from "@vercel/blob";
import { esTipoImagen, formatosImagen, limiteImagen, type TipoImagen } from "./modelo";

async function coincideFirma(archivo: File, tipo: TipoImagen) {
  const bytes = new Uint8Array(await archivo.slice(0, 16).arrayBuffer());
  const coincide = (firma: number[], desde = 0) => firma.every((byte, indice) => bytes[desde + indice] === byte);
  if (tipo === "image/jpeg") return coincide([0xff, 0xd8, 0xff]);
  if (tipo === "image/png") return coincide([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return coincide([0x52, 0x49, 0x46, 0x46]) && coincide([0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38], 8);
}

export async function subirImagen(carpeta: string, archivo: File) {
  if (archivo.size > limiteImagen) return { error: "La imagen debe pesar como máximo 3 MB." } as const;
  const tipo = archivo.type;
  if (!esTipoImagen(tipo) || !(await coincideFirma(archivo, tipo))) {
    return { error: "Selecciona una imagen válida en formato JPEG, PNG o WebP." } as const;
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { error: "El almacenamiento de imágenes aún no está configurado." } as const;
  }

  const ruta = carpeta + "/" + crypto.randomUUID() + "." + formatosImagen[tipo];
  try {
    const blob = await put(ruta, archivo, { access: "private", contentType: tipo, addRandomSuffix: false });
    return { ruta: blob.pathname } as const;
  } catch (error) {
    console.error("Error al subir imagen:", error);
    return { error: "No se pudo subir la imagen. Inténtalo nuevamente." } as const;
  }
}

export async function prepararImagen(carpeta: string, formulario: FormData) {
  const archivo = formulario.get("imagen");
  if (archivo instanceof File && (archivo.name || archivo.size > 0)) {
    const subida = await subirImagen(carpeta, archivo);
    if ("error" in subida) return subida;
    return { referencia: subida.ruta, nueva: subida.ruta } as const;
  }
  if (archivo !== "" && archivo !== null && !(archivo instanceof File)) {
    return { error: "Selecciona un archivo de imagen válido." } as const;
  }
  return { referencia: formulario.get("quitarImagen") === "true" ? null : undefined, nueva: undefined } as const;
}

export function leerImagen(ruta: string) {
  return get(ruta, { access: "private" });
}

export async function eliminarImagen(ruta: string) {
  try {
    await del(ruta);
  } catch (error) {
    console.error("Error al limpiar imagen de Blob:", error);
  }
}
