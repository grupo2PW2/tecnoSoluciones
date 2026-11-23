import { esReferenciaImagen, urlImagen } from "@/features/imagenes/modelo";

export function esImagenRepuesto(ruta: string | null): ruta is string {
  return esReferenciaImagen("repuestos", ruta);
}

export function urlImagenRepuesto(id: number, referencia: string | null) {
  return urlImagen("repuestos", id, referencia);
}
