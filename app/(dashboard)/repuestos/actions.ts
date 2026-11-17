"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

const partStates = [
  "DISPONIBLE",
  "AGOTADO",
  "EN_REPARACION",
  "DESCATALOGADO",
] as const;
type PartState = (typeof partStates)[number];

export type FormState = {
  error?: string;
  success?: string;
};

function getText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isPartState(value: string): value is PartState {
  return partStates.includes(value as PartState);
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

function parseNonNegativeInteger(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

async function requireReceptionAccess() {
  const user = await requireUser();

  if (user.rol !== "ADMINISTRADOR" && user.rol !== "RECEPCIONISTA") {
    throw new Error("FORBIDDEN");
  }
}

export async function savePart(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireReceptionAccess();
  } catch {
    return { error: "No tienes permisos para gestionar repuestos." };
  }

  const idValue = getText(formData, "id");
  const sku = getText(formData, "sku");
  const nombre = getText(formData, "nombre");
  const unidadesCaja = parseNonNegativeInteger(getText(formData, "unidadesCaja"));
  const imgUrl = getText(formData, "imgUrl");
  const precioReferencial = normalizePrice(getText(formData, "precioReferencial"));
  const costoActual = normalizePrice(getText(formData, "costoActual"));
  const estado = getText(formData, "estado");
  const id = idValue ? Number(idValue) : null;

  if (
    !sku ||
    !nombre ||
    unidadesCaja === null ||
    !precioReferencial ||
    !costoActual ||
    !isPartState(estado) ||
    (id !== null && (!Number.isInteger(id) || id < 1))
  ) {
    return { error: "Completa los datos del repuesto con valores válidos." };
  }

  const skuOwner = await db.orm.public.Repuestos.where({ sku }).first();

  if (skuOwner && skuOwner.id !== id) {
    return { error: "El SKU ya está registrado." };
  }

  const data = {
    sku,
    nombre,
    unidadesCaja,
    imgUrl: imgUrl || null,
    precioReferencial,
    costoActual,
    estado,
  };

  if (id === null) {
    await db.orm.public.Repuestos.create(data);
    revalidatePath("/repuestos");
    return { success: "Repuesto creado correctamente." };
  }

  const existingPart = await db.orm.public.Repuestos.first({ id });

  if (!existingPart) {
    return { error: "El repuesto seleccionado no existe." };
  }

  await db.orm.public.Repuestos.where({ id }).update(data);
  revalidatePath("/repuestos");
  return { success: "Repuesto actualizado correctamente." };
}