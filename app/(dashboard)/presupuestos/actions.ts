"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export type FormState = { error?: string; success?: string };

function getText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveInteger(value: string) {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizePrice(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 && price <= 99_999_999.99
    ? price.toFixed(2)
    : null;
}

async function requireBudgetAccess() {
  const user = await requireUser();
  if (user.rol !== "ADMINISTRADOR" && user.rol !== "TECNICO") {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function createBudget(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  let user;
  try {
    user = await requireBudgetAccess();
  } catch {
    return { error: "No tienes permisos para crear presupuestos." };
  }

  const ordenId = Number(getText(formData, "ordenId"));
  const servicioIdValue = getText(formData, "servicioId");
  const repuestoIdValue = getText(formData, "repuestoId");
  const servicioId = servicioIdValue ? Number(servicioIdValue) : null;
  const repuestoId = repuestoIdValue ? Number(repuestoIdValue) : null;
  const cantidad = parsePositiveInteger(getText(formData, "cantidad"));
  const precioUnitario = normalizePrice(getText(formData, "precioUnitario"));
  const descripcion = getText(formData, "descripcion");
  const observaciones = getText(formData, "observaciones");

  if (
    !Number.isInteger(ordenId) ||
    ordenId < 1 ||
    (servicioId === null && repuestoId === null) ||
    (servicioId !== null && repuestoId !== null) ||
    (servicioId !== null && (!Number.isInteger(servicioId) || servicioId < 1)) ||
    (repuestoId !== null && (!Number.isInteger(repuestoId) || repuestoId < 1)) ||
    cantidad === null ||
    !precioUnitario
  ) {
    return { error: "Completa una sola clase de concepto y valores válidos." };
  }

  try {
    await db.transaction(async (tx) => {
      const order = await tx.orm.public.Orden.where({ id: ordenId }).forUpdate().first();

      if (!order || (user.rol === "TECNICO" && order.tecnicoId !== user.id)) {
        throw new Error("ORDER_FORBIDDEN");
      }

      const service = servicioId === null
        ? null
        : await tx.orm.public.Servicios.first({ id: servicioId });
      const part = repuestoId === null
        ? null
        : await tx.orm.public.Repuestos.first({ id: repuestoId });

      if ((servicioId !== null && !service) || (repuestoId !== null && !part)) {
        throw new Error("CONCEPT_NOT_FOUND");
      }

      const latestBudget = await tx.orm.public.Presupuestos
        .where({ ordenId })
        .orderBy((budget) => budget.version.desc())
        .first();
      const version = (latestBudget?.version ?? 0) + 1;
      const budget = await tx.orm.public.Presupuestos.create({
        version,
        ordenId,
        observaciones: observaciones || null,
      });

      await tx.orm.public.DetallePresupuesto.create({
        cantidad,
        precioUnitario,
        descripcion: descripcion || null,
        presupuestoId: budget.id,
        servicioId,
        repuestoId,
      });
      await tx.orm.public.Orden.where({ id: ordenId }).update({ estado: "PENDIENTE_APROBACION" });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_FORBIDDEN") {
      return { error: "No puedes presupuestar esta orden." };
    }
    if (error instanceof Error && error.message === "CONCEPT_NOT_FOUND") {
      return { error: "El servicio o repuesto seleccionado no existe." };
    }
    return { error: "No se pudo crear el presupuesto." };
  }

  revalidatePath("/presupuestos");
  revalidatePath("/ordenes");
  return { success: "Nueva versión de presupuesto creada." };
}