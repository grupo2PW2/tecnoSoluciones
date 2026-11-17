"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export type FormState = {
  error?: string;
  success?: string;
};

function getText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function requireReceptionAccess() {
  const user = await requireUser();

  if (user.rol !== "ADMINISTRADOR" && user.rol !== "RECEPCIONISTA") {
    throw new Error("FORBIDDEN");
  }
}

function normalizePrice(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) {
    return null;
  }

  const price = Number(value);

  if (!Number.isFinite(price) || price < 0 || price > 99_999_999.99) {
    return null;
  }

  return price.toFixed(2);
}

export async function saveService(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireReceptionAccess();
  } catch {
    return { error: "No tienes permisos para gestionar servicios." };
  }

  const idValue = getText(formData, "id");
  const nombre = getText(formData, "nombre");
  const descripcion = getText(formData, "descripcion");
  const priceValue = getText(formData, "precioReferencial");
  const activo = formData.get("activo") === "on";
  const id = idValue ? Number(idValue) : null;
  const precioReferencial = normalizePrice(priceValue);

  if (
    !nombre ||
    nombre.length < 2 ||
    !precioReferencial ||
    (id !== null && (!Number.isInteger(id) || id < 1))
  ) {
    return { error: "Completa el nombre y un precio válido para el servicio." };
  }

  const nameOwner = await db.orm.public.Servicios.where({ nombre }).first();

  if (nameOwner && nameOwner.id !== id) {
    return { error: "Ya existe un servicio con ese nombre." };
  }

  const data = {
    nombre,
    descripcion: descripcion || null,
    precioReferencial,
    activo,
  };

  if (id === null) {
    await db.orm.public.Servicios.create(data);
    revalidatePath("/servicios");
    return { success: "Servicio creado correctamente." };
  }

  const existingService = await db.orm.public.Servicios.first({ id });

  if (!existingService) {
    return { error: "El servicio seleccionado no existe." };
  }

  await db.orm.public.Servicios.where({ id }).update(data);
  revalidatePath("/servicios");
  return { success: "Servicio actualizado correctamente." };
}

export async function toggleService(formData: FormData) {
  try {
    await requireReceptionAccess();
  } catch {
    return;
  }

  const id = Number(getText(formData, "id"));

  if (!Number.isInteger(id) || id < 1) {
    return;
  }

  const service = await db.orm.public.Servicios.first({ id });

  if (!service) {
    return;
  }

  await db.orm.public.Servicios.where({ id }).update({ activo: !service.activo });
  revalidatePath("/servicios");
}