"use client";

import { useActionState } from "react";

import { registerMovement } from "@/app/(dashboard)/movimientos/actions";
import type { FormState } from "@/app/(dashboard)/movimientos/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type PartOption = {
  id: number;
  sku: string;
  nombre: string;
  costoActual: string;
};

type MovementDetail = {
  id: number;
  cantidad: number;
  costoUnitario: string;
  movimiento: {
    tipo: string;
    fecha: Date;
    observaciones: string | null;
  };
  repuesto: {
    sku: string;
    nombre: string;
  };
};

const initialState: FormState = {};

const movementLabels: Record<string, string> = {
  ENTRADA: "Entrada",
  AJUSTE_POSITIVO: "Ajuste positivo",
  AJUSTE_NEGATIVO: "Ajuste negativo",
};

export function MovementManagement({
  parts,
  details,
}: {
  parts: PartOption[];
  details: MovementDetail[];
}) {
  const [state, formAction, isPending] = useActionState(registerMovement, initialState);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Registrar movimiento</CardTitle>
          <CardDescription>
            Las entradas y ajustes actualizan el stock dentro de una transacción.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Primero registra al menos un repuesto.
            </p>
          ) : (
            <form action={formAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  name="tipo"
                  defaultValue="ENTRADA"
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                >
                  <option value="ENTRADA">Entrada</option>
                  <option value="AJUSTE_POSITIVO">Ajuste positivo</option>
                  <option value="AJUSTE_NEGATIVO">Ajuste negativo</option>
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="repuestoId">Repuesto</Label>
                <select
                  id="repuestoId"
                  name="repuestoId"
                  defaultValue=""
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                  required
                >
                  <option value="" disabled>
                    Selecciona un repuesto
                  </option>
                  {parts.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.sku} · {part.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cantidad">Cantidad</Label>
                <Input id="cantidad" name="cantidad" type="number" min="1" step="1" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="costoUnitario">Costo unitario</Label>
                <Input id="costoUnitario" name="costoUnitario" type="number" min="0" step="0.01" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input id="observaciones" name="observaciones" />
              </div>
              {state.error ? (
                <p className="text-sm text-destructive" aria-live="polite">
                  {state.error}
                </p>
              ) : null}
              {state.success ? (
                <p className="text-sm text-emerald-700" aria-live="polite">
                  {state.success}
                </p>
              ) : null}
              <Button type="submit" disabled={isPending}>
                {isPending ? "Registrando..." : "Registrar movimiento"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial de movimientos</CardTitle>
          <CardDescription>{details.length} detalles registrados.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {details.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay movimientos registrados.</p>
          ) : (
            details.map((detail) => (
              <div key={detail.id} className="rounded-lg border p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium">{detail.repuesto.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {movementLabels[detail.movimiento.tipo] ?? detail.movimiento.tipo}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  SKU: {detail.repuesto.sku} · Cantidad: {detail.cantidad} · Costo: ${detail.costoUnitario}
                </p>
                <p className="text-xs text-muted-foreground">
                  {detail.movimiento.fecha.toLocaleString("es-ES")}
                  {detail.movimiento.observaciones ? ` · ${detail.movimiento.observaciones}` : ""}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}