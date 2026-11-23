import "server-only";

import { db } from "@/src/prisma/db";

export async function listarUsuarios() {
  return db.orm.public.Usuarios.select("id", "nombre", "apellido", "DNI", "telefono", "username", "rol", "activo", "avatar")
    .include("tecnico", (ordenes) => ordenes.where((orden) => orden.fechaCierreTecnico.isNull()).count())
    .orderBy([(usuario) => usuario.apellido.asc(), (usuario) => usuario.nombre.asc(), (usuario) => usuario.id.asc()])
    .all();
}

export type UsuarioListado = Awaited<ReturnType<typeof listarUsuarios>>[number];
