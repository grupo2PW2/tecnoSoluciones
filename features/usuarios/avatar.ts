import { urlImagen } from "@/features/imagenes/modelo";

export function urlAvatar(id: number, avatar: string | null) {
  const urlPrivada = urlImagen("usuarios", id, avatar);
  if (urlPrivada) return urlPrivada;
  if (!avatar) return null;
  return /^https?:\/\//i.test(avatar) || /^\/[^/\\]/.test(avatar) ? avatar : null;
}
