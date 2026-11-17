"use client";

import { useActionState } from "react";

import { decideBudget } from "@/app/(publico)/orden/[codigo]/actions";
import type { BudgetDecisionState } from "@/app/(publico)/orden/[codigo]/actions";
import { Button } from "@/components/ui/button";

type BudgetDetail = {
  id: number;
  cantidad: number;
  precioUnitario: string;
  descripcion: string | null;
  servicio: { nombre: string } | null;
  repuesto: { nombre: string; sku: string } | null;
};

type Budget = {
  id: number;
  version: number;
  fechaRegistro: Date;
  observaciones: string | null;
  detallePresupuesto: BudgetDetail[];
};

const initialState: BudgetDecisionState = {};

export function BudgetDecision({
  budget,
  codigoCliente,
}: {
  budget: Budget;
  codigoCliente: string;
}) {
  const [state, formAction, isPending] = useActionState(decideBudget, initialState);
  const total = budget.detallePresupuesto.reduce(
    (sum, detail) => sum + detail.cantidad * Number(detail.precioUnitario),
    0,
  );

  return (
    <section className="grid gap-4 rounded-xl bg-card p-6 text-card-foreground ring-1 ring-foreground/10">
      <div>
        <p className="text-sm text-muted-foreground">Presupuesto pendiente · Versión {budget.version}</p>
        <h2 className="text-xl font-semibold">Revisa y decide</h2>
      </div>
      <div className="grid gap-2 border-t pt-4">
        {budget.detallePresupuesto.map((detail) => (
          <div key={detail.id} className="flex justify-between gap-4 text-sm">
            <span>
              {detail.cantidad} × {detail.servicio?.nombre ?? detail.repuesto?.nombre ?? "Concepto"}
              {detail.descripcion ? ` · ${detail.descripcion}` : ""}
            </span>
            <span>${(detail.cantidad * Number(detail.precioUnitario)).toFixed(2)}</span>
          </div>
        ))}
        <div className="flex justify-between border-t pt-2 font-semibold">
          <span>Total propuesto</span>
          <span>${total.toFixed(2)}</span>
        </div>
      </div>
      {budget.observaciones ? <p className="text-sm text-muted-foreground">{budget.observaciones}</p> : null}
      <form action={formAction} className="grid gap-2 sm:grid-cols-2">
        <input type="hidden" name="codigoCliente" value={codigoCliente} />
        <input type="hidden" name="presupuestoId" value={budget.id} />
        <Button name="decision" value="APROBADO" type="submit" disabled={isPending}>
          Aprobar presupuesto
        </Button>
        <Button name="decision" value="RECHAZADO" type="submit" variant="outline" disabled={isPending}>
          Rechazar presupuesto
        </Button>
      </form>
      {state.error ? <p className="text-sm text-destructive" aria-live="polite">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700" aria-live="polite">{state.success}</p> : null}
    </section>
  );
}