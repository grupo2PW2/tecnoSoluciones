import "server-only";

import { or } from "@prisma/orm-postgres/orm-client";
import { contarOrdenesActivas } from "@/features/ordenes/asignacion";
import { hashPassword } from "@/lib/password";
import { db } from "@/src/prisma/db";
import type { AccesoUsuario, AltaUsuario, EdicionUsuario } from "./schemas";

export async function crearUsuario(autorId: number, { password, telefono, ...datos }: AltaUsuario, avatar?: string) {
  const hash = await hashPassword(password);
  return db.transaction(async (tx) => {
    const autor = await tx.orm.public.Usuarios.where({ id: autorId, rol: "ADMINISTRADOR", activo: true })
      .select("id").forShare().first();
    if (!autor) return { error: "Solo Administración puede registrar usuarios." } as const;

    const usuario = await tx.orm.public.Usuarios.select("id")
      .create({ ...datos, telefono: telefono || null, password: hash, ...(avatar !== undefined && { avatar }) });
    return { usuario } as const;
  });
}

export async function editarUsuario(autorId: number, id: number, { password, telefono, ...datos }: EdicionUsuario, avatar?: string | null) {
  const hash = password ? await hashPassword(password) : null;
  return db.transaction(async (tx) => {
    const { autor, usuario } = await bloquearUsuarios(tx, autorId, id);
    if (autor?.rol !== "ADMINISTRADOR" || !autor.activo) return { error: "Solo Administración puede editar usuarios." } as const;
    if (!usuario) return { error: "El usuario ya no está registrado." } as const;

    await tx.orm.public.Usuarios.where({ id }).update({
      ...datos, telefono: telefono || null, ...(hash && { password: hash }), ...(avatar !== undefined && { avatar }),
    });
    return { usuario: { id }, avatarAnterior: avatar !== undefined ? usuario.avatar : null } as const;
  });
}

async function bloquearUsuarios(tx: Pick<typeof db, "orm">, autorId: number, id: number) {
  const usuarios = await tx.orm.public.Usuarios.where((usuario) => usuario.id.in([autorId, id]))
    .select("id", "rol", "activo", "avatar").orderBy((usuario) => usuario.id.asc()).forNoKeyUpdate().all();
  return { autor: usuarios.find((usuario) => usuario.id === autorId), usuario: usuarios.find((usuario) => usuario.id === id) };
}

export function cambiarAccesoUsuario(autorId: number, id: number, acceso: AccesoUsuario, anterior: AccesoUsuario) {
  return db.transaction(async (tx) => {
    const { autor, usuario } = await bloquearUsuarios(tx, autorId, id);
    if (autor?.rol !== "ADMINISTRADOR" || !autor.activo) return { error: "Solo Administración puede gestionar el acceso." } as const;
    if (!usuario) return { error: "El usuario ya no está registrado." } as const;
    if (usuario.rol === "ADMINISTRADOR" && acceso.rol !== usuario.rol) {
      return { error: "El rol de una cuenta administradora es fijo." } as const;
    }
    if (id === autorId && !acceso.activo) {
      return { error: "Otro administrador debe desactivar tu cuenta." } as const;
    }
    if (usuario.rol === acceso.rol && usuario.activo === acceso.activo) return { usuario: { id } } as const;
    if (usuario.rol !== anterior.rol || usuario.activo !== anterior.activo) {
      return { error: "El acceso cambió. Actualiza la página antes de volver a guardarlo." } as const;
    }
    if (usuario.rol === "TECNICO" && (acceso.rol !== usuario.rol || !acceso.activo) &&
      await contarOrdenesActivas(tx, id) > 0) {
      return { error: "El técnico tiene órdenes pendientes de cierre técnico." } as const;
    }

    await tx.orm.public.Usuarios.where({ id }).update(acceso);
    return { usuario: { id } } as const;
  });
}

export async function errorGuardarUsuario({ username, DNI }: Pick<AltaUsuario, "username" | "DNI">, error: unknown, id?: number) {
  const existentes = await db.orm.public.Usuarios
    .where((usuario) => or(usuario.username.eq(username), usuario.DNI.eq(DNI)))
    .select("id", "username", "DNI").all().then((usuarios) => usuarios, () => []);
  if (existentes.some((usuario) => usuario.id !== id && usuario.username === username)) {
    return { error: "Ya existe una cuenta con ese nombre de usuario." } as const;
  }
  if (existentes.some((usuario) => usuario.id !== id && usuario.DNI === DNI)) {
    return { error: "Ya existe una cuenta con ese documento de identidad." } as const;
  }
  console.error("Error al guardar usuario:", error);
  return { error: "No se pudo guardar el usuario. Inténtalo nuevamente." } as const;
}
