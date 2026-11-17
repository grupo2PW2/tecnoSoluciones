"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

const deviceTypes = [
  "COMPUTADORA",
  "CELULAR",
  "LAPTOP",
  "NOTEBOOK",
  "TABLET",
  "SMARTWATCH",
  "IMPRESORA",
  "SCANNER",
  "OTRO",
] as const;
type DeviceType = (typeof deviceTypes)[number];

export type FormState = {
  error?: string;
  success?: string;
};

function getText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isDeviceType(value: string): value is DeviceType {
  return deviceTypes.includes(value as DeviceType);
}

async function requireReceptionAccess() {
  const user = await requireUser();

  if (user.rol !== "ADMINISTRADOR" && user.rol !== "RECEPCIONISTA") {
    throw new Error("FORBIDDEN");
  }
}

export async function saveDevice(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireReceptionAccess();
  } catch {
    return { error: "No tienes permisos para gestionar dispositivos." };
  }

  const idValue = getText(formData, "id");
  const tipo = getText(formData, "tipo");
  const marca = getText(formData, "marca");
  const modelo = getText(formData, "modelo");
  const nroSerie = getText(formData, "nroSerie");
  const imgUrl = getText(formData, "imgUrl");
  const clienteId = Number(getText(formData, "clienteId"));
  const id = idValue ? Number(idValue) : null;

  if (
    !isDeviceType(tipo) ||
    !marca ||
    !modelo ||
    !Number.isInteger(clienteId) ||
    clienteId < 1 ||
    (id !== null && (!Number.isInteger(id) || id < 1))
  ) {
    return { error: "Completa el tipo, marca, modelo y cliente del dispositivo." };
  }

  const client = await db.orm.public.Clientes.first({ id: clienteId });

  if (!client) {
    return { error: "El cliente seleccionado no existe." };
  }

  if (nroSerie) {
    const serialOwner = await db.orm.public.Dispositivos.where({ nroSerie }).first();

    if (serialOwner && serialOwner.id !== id) {
      return { error: "El número de serie ya está registrado." };
    }
  }

  const data = {
    tipo,
    marca,
    modelo,
    nroSerie: nroSerie || null,
    imgUrl: imgUrl || null,
    clienteId,
  };

  if (id === null) {
    await db.orm.public.Dispositivos.create(data);
    revalidatePath("/dispositivos");
    return { success: "Dispositivo creado correctamente." };
  }

  const existingDevice = await db.orm.public.Dispositivos.first({ id });

  if (!existingDevice) {
    return { error: "El dispositivo seleccionado no existe." };
  }

  await db.orm.public.Dispositivos.where({ id }).update(data);
  revalidatePath("/dispositivos");
  return { success: "Dispositivo actualizado correctamente." };
}