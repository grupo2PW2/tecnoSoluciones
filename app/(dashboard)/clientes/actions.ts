"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/src/prisma/db";
import { requireUser } from "@/lib/auth";

const contactTypes = [
  "TELEFONO",
  "CORREO",
  "WHATSAPP",
  "FACEBOOK",
  "INSTAGRAM",
  "LINKEDIN",
  "OTRO",
] as const;
type ContactType = (typeof contactTypes)[number];

export type FormState = {
  error?: string;
  success?: string;
};

function getText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isContactType(value: string): value is ContactType {
  return contactTypes.includes(value as ContactType);
}

async function requireReceptionAccess() {
  const user = await requireUser();

  if (user.rol !== "ADMINISTRADOR" && user.rol !== "RECEPCIONISTA") {
    throw new Error("FORBIDDEN");
  }
}

export async function saveClient(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireReceptionAccess();
  } catch {
    return { error: "No tienes permisos para gestionar clientes." };
  }

  const idValue = getText(formData, "id");
  const nombre = getText(formData, "nombre");
  const ciudad = getText(formData, "ciudad");
  const direccion = getText(formData, "direccion");
  const id = idValue ? Number(idValue) : null;

  if (
    !nombre ||
    nombre.length < 2 ||
    !ciudad ||
    (id !== null && (!Number.isInteger(id) || id < 1))
  ) {
    return { error: "Completa el nombre y la ciudad del cliente." };
  }

  if (id === null) {
    await db.orm.public.Clientes.create({
      nombre,
      ciudad,
      direccion: direccion || null,
    });
    revalidatePath("/clientes");
    return { success: "Cliente creado correctamente." };
  }

  const existingClient = await db.orm.public.Clientes.first({ id });

  if (!existingClient) {
    return { error: "El cliente seleccionado no existe." };
  }

  await db.orm.public.Clientes.where({ id }).update({
    nombre,
    ciudad,
    direccion: direccion || null,
  });
  revalidatePath("/clientes");
  return { success: "Cliente actualizado correctamente." };
}

export async function saveContact(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireReceptionAccess();
  } catch {
    return { error: "No tienes permisos para gestionar contactos." };
  }

  const contactIdValue = getText(formData, "contactId");
  const clienteId = Number(getText(formData, "clienteId"));
  const tipo = getText(formData, "tipo");
  const valor = getText(formData, "valor");
  const principal = formData.get("principal") === "on";
  const contactId = contactIdValue ? Number(contactIdValue) : null;

  if (
    !Number.isInteger(clienteId) ||
    clienteId < 1 ||
    !isContactType(tipo) ||
    !valor ||
    (contactId !== null && (!Number.isInteger(contactId) || contactId < 1))
  ) {
    return { error: "Completa el tipo y valor del contacto." };
  }

  const client = await db.orm.public.Clientes.first({ id: clienteId });

  if (!client) {
    return { error: "El cliente seleccionado no existe." };
  }

  const valueOwner = await db.orm.public.Contactos.where({ valor }).first();

  if (valueOwner && valueOwner.id !== contactId) {
    return { error: "El valor del contacto ya está registrado." };
  }

  if (contactId !== null) {
    const existingContact = await db.orm.public.Contactos.first({ id: contactId });

    if (!existingContact || existingContact.clienteId !== clienteId) {
      return { error: "El contacto seleccionado no pertenece al cliente." };
    }
  }

  await db.transaction(async (tx) => {
    if (principal) {
      await tx.orm.public.Contactos.where({ clienteId }).update({ principal: false });
    }

    if (contactId === null) {
      await tx.orm.public.Contactos.create({
        tipo,
        valor,
        principal,
        clienteId,
      });
    } else {
      await tx.orm.public.Contactos.where({ id: contactId }).update({
        tipo,
        valor,
        principal,
      });
    }
  });

  revalidatePath("/clientes");
  return { success: "Contacto guardado correctamente." };
}

export async function deleteContact(formData: FormData) {
  try {
    await requireReceptionAccess();
  } catch {
    return;
  }

  const contactId = Number(getText(formData, "contactId"));

  if (!Number.isInteger(contactId) || contactId < 1) {
    return;
  }

  await db.orm.public.Contactos.where({ id: contactId }).delete();
  revalidatePath("/clientes");
}