"use client";

import { useActionState } from "react";

import { createBudget } from "@/app/(dashboard)/presupuestos/actions";
import type { FormState } from "@/app/(dashboard)/presupuestos/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Order = { id: number; codigo: string; diagnostico: string | null };
type Service = { id: number; nombre: string; precioReferencial: string };
type Part = { id: number; sku: string; nombre: string; precioReferencial: string };
type Budget = { id: number; ordenId: number; version: number; estado: string; orden: { codigo: string } };

const initialState: FormState = {};

export function BudgetManagement({
  orders,
  services,
  parts,
  budgets,
}: {
  orders: Order[];
  services: Service[];
  parts: Part[];
  budgets: Budget[];
}) {
  const [state, formAction, isPending] = useActionState(createBudget, initialState);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Nueva versión</CardTitle>
          <CardDescription>Presupuesta un servicio o un repuesto, nunca ambos en la misma línea.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ordenId">Orden diagnosticada</Label>
              <select id="ordenId" name="ordenId" defaultValue="" className="h-8 rounded-lg border border-input bg-background px-2 text-sm" required>
                <option value="" disabled>Selecciona una orden</option>
                {orders.map((order) => <option key={order.id} value={order.id}>{order.codigo}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="servicioId">Servicio (opcional)</Label>
              <select id="servicioId" name="servicioId" defaultValue="" className="h-8 rounded-lg border border-input bg-background px-2 text-sm">
                <option value="">Ninguno</option>
                {services.map((service) => <option key={service.id} value={service.id}>{service.nombre} · ${service.precioReferencial}</option>)}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="repuestoId">Repuesto (opcional)</Label>
              <select id="repuestoId" name="repuestoId" defaultValue="" className="h-8 rounded-lg border border-input bg-background px-2 text-sm">
                <option value="">Ninguno</option>
                {parts.map((part) => <option key={part.id} value={part.id}>{part.sku} · {part.nombre}</option>)}
              </select>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="grid gap-2"><Label htmlFor="cantidad">Cantidad</Label><Input id="cantidad" name="cantidad" type="number" min="1" step="1" defaultValue="1" required /></div>
              <div className="grid gap-2"><Label htmlFor="precioUnitario">Precio unitario</Label><Input id="precioUnitario" name="precioUnitario" type="number" min="0" step="0.01" required /></div>
            </div>
            <div className="grid gap-2"><Label htmlFor="descripcion">Descripción</Label><Input id="descripcion" name="descripcion" /></div>
            <div className="grid gap-2"><Label htmlFor="observaciones">Observaciones</Label><Input id="observaciones" name="observaciones" /></div>
            {state.error ? <p className="text-sm text-destructive" aria-live="polite">{state.error}</p> : null}
            {state.success ? <p className="text-sm text-emerald-700" aria-live="polite">{state.success}</p> : null}
            <Button type="submit" disabled={isPending}>{isPending ? "Creando..." : "Crear presupuesto"}</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Presupuestos</CardTitle><CardDescription>{budgets.length} versiones registradas.</CardDescription></CardHeader>
        <CardContent className="grid gap-3">
          {budgets.map((budget) => (
            <div key={budget.id} className="rounded-lg border p-3">
              <p className="font-medium">{budget.orden.codigo} · Versión {budget.version}</p>
              <p className="text-sm text-muted-foreground">Estado: {budget.estado}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}