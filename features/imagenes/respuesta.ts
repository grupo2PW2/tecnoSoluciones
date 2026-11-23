import "server-only";

import { leerImagen } from "./blob";
import { esReferenciaImagen, esTipoImagen } from "./modelo";

const cabeceras = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export function respuestaImagenVacia(status: number) {
  return new Response(null, { status, headers: cabeceras });
}

export async function responderImagen(carpeta: string, referencia: string | null) {
  if (!esReferenciaImagen(carpeta, referencia)) return respuestaImagenVacia(404);
  const imagen = await leerImagen(referencia);
  if (!imagen || imagen.statusCode !== 200 || !esTipoImagen(imagen.blob.contentType)) {
    return respuestaImagenVacia(404);
  }
  return new Response(imagen.stream, { headers: { ...cabeceras, "Content-Type": imagen.blob.contentType } });
}
