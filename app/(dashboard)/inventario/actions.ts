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

export async function saveStockMinimum(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireReceptionAccess();
  } catch {
    return { error: "No tienes permisos para gestionar inventario." };
  }

  const repuestoId = Number(getText(formData, "repuestoId"));
  const stockMinimo = parseNonNegativeInteger(getText(formData, "stockMinimo"));

  if (!Number.isInteger(repuestoId) || repuestoId < 1 || stockMinimo === null) {
    return { error: "Ingresa un stock mínimo válido." };
  }

  const part = await db.orm.public.Repuestos.first({ id: repuestoId });

  if (!part) {
    return { error: "El repuesto seleccionado no existe." };
  }

  const inventory = await db.orm.public.Inventario.where({ repuestoId }).first();

  if (inventory && stockMinimo > inventory.stock) {
    await db.orm.public.Inventario.where({ repuestoId }).update({ stockMinimo });
  } else if (inventory) {
    await db.orm.public.Inventario.where({ repuestoId }).update({ stockMinimo });
  } else {
    await db.orm.public.Inventario.create({ repuestoId, stock: 0, stockMinimo });
  }

  revalidatePath("/inventario");
  return { success: "Stock mínimo actualizado correctamente." };
}