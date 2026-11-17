"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

const movementTypes = ["ENTRADA", "AJUSTE_POSITIVO", "AJUSTE_NEGATIVO"] as const;
type MovementType = (typeof movementTypes)[number];

export type FormState = {
  error?: string;
  success?: string;
};

function getText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isMovementType(value: string): value is MovementType {
  return movementTypes.includes(value as MovementType);
}

function parsePositiveInteger(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
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

async function requireReceptionAccess() {
  const user = await requireUser();

  if (user.rol !== "ADMINISTRADOR" && user.rol !== "RECEPCIONISTA") {
    throw new Error("FORBIDDEN");
  }
}

export async function registerMovement(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireReceptionAccess();
  } catch {
    return { error: "No tienes permisos para registrar movimientos." };
  }

  const tipo = getText(formData, "tipo");
  const repuestoId = Number(getText(formData, "repuestoId"));
  const cantidad = parsePositiveInteger(getText(formData, "cantidad"));
  const costoUnitario = normalizePrice(getText(formData, "costoUnitario"));
  const observaciones = getText(formData, "observaciones");

  if (
    !isMovementType(tipo) ||
    !Number.isInteger(repuestoId) ||
    repuestoId < 1 ||
    cantidad === null ||
    !costoUnitario
  ) {
    return { error: "Completa el tipo, repuesto, cantidad y costo unitario." };
  }

  try {
    await db.transaction(async (tx) => {
      const part = await tx.orm.public.Repuestos.first({ id: repuestoId });

      if (!part) {
        throw new Error("PART_NOT_FOUND");
      }

      const inventory = await tx.orm.public.Inventario
        .where({ repuestoId })
        .forUpdate()
        .first();
      const currentStock = inventory?.stock ?? 0;
      const stockDelta = tipo === "AJUSTE_NEGATIVO" ? -cantidad : cantidad;
      const nextStock = currentStock + stockDelta;

      if (nextStock < 0) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const movement = await tx.orm.public.Movimientos.create({
        tipo,
        observaciones: observaciones || null,
      });

      await tx.orm.public.DetalleMovimientos.create({
        cantidad,
        costoUnitario,
        precioUnitario: null,
        movimientoId: movement.id,
        repuestoId,
      });

      if (inventory) {
        await tx.orm.public.Inventario.where({ repuestoId }).update({ stock: nextStock });
      } else {
        await tx.orm.public.Inventario.create({
          repuestoId,
          stock: nextStock,
          stockMinimo: 0,
        });
      }

      if (tipo === "ENTRADA" && Number(costoUnitario) > Number(part.costoActual)) {
        await tx.orm.public.Repuestos.where({ id: repuestoId }).update({ costoActual: costoUnitario });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PART_NOT_FOUND") {
      return { error: "El repuesto seleccionado no existe." };
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return { error: "El ajuste dejaría el stock en un valor negativo." };
    }

    return { error: "No se pudo registrar el movimiento." };
  }

  revalidatePath("/movimientos");
  revalidatePath("/inventario");
  return { success: "Movimiento registrado correctamente." };
}