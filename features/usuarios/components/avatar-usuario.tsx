"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function AvatarUsuario({ nombre, apellido, src }: { nombre: string; apellido: string; src: string | null }) {
  const iniciales = ((nombre[0] ?? "") + (apellido[0] ?? "")).toLocaleUpperCase("es-BO");
  return <Avatar className="shrink-0">
    {src && <AvatarImage key={src} src={src} alt="" />}
    <AvatarFallback>{iniciales}</AvatarFallback>
  </Avatar>;
}
