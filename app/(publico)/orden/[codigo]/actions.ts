"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/src/prisma/db";

export type BudgetDecisionState = { error?: string; success?: string };

export async function decideBudget(
  _previousState: BudgetDecisionState,
  formData: FormData,
): Promise<BudgetDecisionState> {
  const codigoCliente = String(formData.get("codigoCliente") ?? "");
  const presupuestoId = Number(formData.get("presupuestoId"));
  const decision = formData.get("decision");

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(codigoCliente) ||
    !Number.isInteger(presupuestoId) ||
    presupuestoId < 1 ||
    (decision !== "APROBADO" && decision !== "RECHAZADO")
  ) {
    return { error: "La decisión no es válida." };
  }

  const order = await db.orm.public.Orden.where({ codigoCliente }).first();
  const budget = await db.orm.public.Presupuestos.first({ id: presupuestoId });

  if (!order || !budget || budget.ordenId !== order.id || budget.estado !== "PENDIENTE_APROBACION") {
    return { error: "El presupuesto ya no está disponible." };
  }

  try {
    await db.transaction(async (tx) => {
      const lockedBudget = await tx.orm.public.Presupuestos.where({ id: presupuestoId }).forUpdate().first();

      if (!lockedBudget || lockedBudget.estado !== "PENDIENTE_APROBACION") {
        throw new Error("BUDGET_UNAVAILABLE");
      }

      await tx.orm.public.Presupuestos.where({ id: presupuestoId }).update({
        estado: decision,
        fechaRespuesta: new Date(),
      });
      await tx.orm.public.Orden.where({ id: order.id }).update({
        estado: decision === "APROBADO" ? "EN_REPARACION" : "DIAGNOSTICADO",
      });
    });
  } catch (error) {
    return {
      error: error instanceof Error && error.message === "BUDGET_UNAVAILABLE"
        ? "El presupuesto ya fue respondido."
        : "No se pudo registrar la decisión.",
    };
  }

  revalidatePath(`/orden/${codigoCliente}`);
  revalidatePath("/presupuestos");
  return { success: decision === "APROBADO" ? "Presupuesto aprobado." : "Presupuesto rechazado." };
}