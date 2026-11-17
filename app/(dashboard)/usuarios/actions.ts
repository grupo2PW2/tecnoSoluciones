"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { db } from "@/src/prisma/db";

const roles = ["ADMINISTRADOR", "TECNICO", "RECEPCIONISTA", "GERENTE"] as const;
type Rol = (typeof roles)[number];

export type UserFormState = {
  error?: string;
  success?: string;
};

function isRole(value: string): value is Rol {
  return roles.includes(value as Rol);
}

function getText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function requireAdministrator() {
  const user = await requireUser();

  if (user.rol !== "ADMINISTRADOR") {
    throw new Error("FORBIDDEN");
  }

  return user;
}

export async function saveUser(
  _previousState: UserFormState,
  formData: FormData,
): Promise<UserFormState> {
  let currentUser;

  try {
    currentUser = await requireAdministrator();
  } catch {
    return { error: "No tienes permisos para administrar usuarios." };
  }

  const idValue = getText(formData, "id");
  const nombre = getText(formData, "nombre");
  const DNI = getText(formData, "DNI");
  const username = getText(formData, "username");
  const password = getText(formData, "password");
  const rolValue = getText(formData, "rol");
  const activo = formData.get("activo") === "on";
  const id = idValue ? Number(idValue) : null;

  if (
    !nombre ||
    nombre.length < 2 ||
    !DNI ||
    !username ||
    !isRole(rolValue) ||
    (id !== null && (!Number.isInteger(id) || id < 1))
  ) {
    return { error: "Completa los datos obligatorios del usuario." };
  }

  if (id === null && password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (id === currentUser.id && !activo) {
    return { error: "No puedes desactivar tu propio usuario." };
  }

  const usernameOwner = await db.orm.public.Usuarios.where({ username }).first();
  const dniOwner = await db.orm.public.Usuarios.where({ DNI }).first();

  if (usernameOwner && usernameOwner.id !== id) {
    return { error: "El nombre de usuario ya está registrado." };
  }

  if (dniOwner && dniOwner.id !== id) {
    return { error: "El DNI ya está registrado." };
  }

  if (id === null) {
    await db.orm.public.Usuarios.create({
      nombre,
      DNI,
      username,
      password: await hashPassword(password),
      activo,
      rol: rolValue,
    });
    revalidatePath("/usuarios");
    return { success: "Usuario creado correctamente." };
  }

  const existingUser = await db.orm.public.Usuarios.first({ id });

  if (!existingUser) {
    return { error: "El usuario seleccionado no existe." };
  }

  if (password && password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  if (password) {
    await db.orm.public.Usuarios.where({ id }).update({
      nombre,
      DNI,
      username,
      password: await hashPassword(password),
      activo,
      rol: rolValue,
    });
  } else {
    await db.orm.public.Usuarios.where({ id }).update({
      nombre,
      DNI,
      username,
      activo,
      rol: rolValue,
    });
  }

  revalidatePath("/usuarios");
  return { success: "Usuario actualizado correctamente." };
}

export async function toggleUser(formData: FormData) {
  const currentUser = await requireAdministrator();
  const id = Number(getText(formData, "id"));

  if (!Number.isInteger(id) || id < 1 || id === currentUser.id) {
    return;
  }

  const user = await db.orm.public.Usuarios.first({ id });

  if (!user) {
    return;
  }

  await db.orm.public.Usuarios.where({ id }).update({ activo: !user.activo });
  revalidatePath("/usuarios");
}