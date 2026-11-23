export const limiteImagen = 3_000_000;

export const formatosImagen = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const nombreImagen = /^[a-f0-9-]{36}\.(jpg|png|webp)$/;

export function esReferenciaImagen(carpeta: string, ruta: string | null): ruta is string {
  const prefijo = carpeta + "/";
  return ruta !== null && ruta.startsWith(prefijo) && nombreImagen.test(ruta.slice(prefijo.length));
}

export function urlImagen(carpeta: string, id: number, ruta: string | null) {
  return esReferenciaImagen(carpeta, ruta)
    ? "/api/" + carpeta + "/" + id + "/imagen?v=" + encodeURIComponent(ruta)
    : null;
}

export type TipoImagen = keyof typeof formatosImagen;

export function esTipoImagen(tipo: string): tipo is TipoImagen {
  return Object.hasOwn(formatosImagen, tipo);
}
