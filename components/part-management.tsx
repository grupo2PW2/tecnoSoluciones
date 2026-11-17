"use client";

import { useActionState, useState } from "react";

import { savePart } from "@/app/(dashboard)/repuestos/actions";
import type { FormState } from "@/app/(dashboard)/repuestos/actions";
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

type PartState = "DISPONIBLE" | "AGOTADO" | "EN_REPARACION" | "DESCATALOGADO";

type Part = {
  id: number;
  sku: string;
  nombre: string;
  unidadesCaja: number;
  imgUrl: string | null;
  precioReferencial: string;
  costoActual: string;
  estado: PartState;
};

const initialState: FormState = {};

const stateLabels: Record<PartState, string> = {
  DISPONIBLE: "Disponible",
  AGOTADO: "Agotado",
  EN_REPARACION: "En reparación",
  DESCATALOGADO: "Descatalogado",
};

export function PartManagement({ parts }: { parts: Part[] }) {
  const [editingPart, setEditingPart] = useState<Part | null>(null);
  const [state, formAction, isPending] = useActionState(savePart, initialState);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{editingPart ? "Editar repuesto" : "Nuevo repuesto"}</CardTitle>
          <CardDescription>
            Mantén el catálogo y los valores históricos de referencia actualizados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            key={editingPart?.id ?? "new-part"}
            action={formAction}
            className="grid gap-4"
          >
            <input type="hidden" name="id" value={editingPart?.id ?? ""} />
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" defaultValue={editingPart?.sku ?? ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" defaultValue={editingPart?.nombre ?? ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unidadesCaja">Unidades por caja</Label>
              <Input
                id="unidadesCaja"
                name="unidadesCaja"
                type="number"
                min="0"
                step="1"
                defaultValue={editingPart?.unidadesCaja ?? 0}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="precioReferencial">Precio referencial</Label>
              <Input
                id="precioReferencial"
                name="precioReferencial"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editingPart?.precioReferencial ?? "0.00"}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="costoActual">Costo actual</Label>
              <Input
                id="costoActual"
                name="costoActual"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editingPart?.costoActual ?? "0.00"}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estado">Estado</Label>
              <select
                id="estado"
                name="estado"
                defaultValue={editingPart?.estado ?? "DISPONIBLE"}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              >
                {Object.entries(stateLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="imgUrl">URL de imagen</Label>
              <Input id="imgUrl" name="imgUrl" type="url" defaultValue={editingPart?.imgUrl ?? ""} />
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
            <div className="flex gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Guardando..." : editingPart ? "Guardar cambios" : "Crear repuesto"}
              </Button>
              {editingPart ? (
                <Button type="button" variant="outline" onClick={() => setEditingPart(null)}>
                  Nuevo
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Repuestos registrados</CardTitle>
          <CardDescription>{parts.length} repuestos en el catálogo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {parts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay repuestos registrados.</p>
          ) : (
            parts.map((part) => (
              <div key={part.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{part.nombre}</p>
                  <p className="text-sm text-muted-foreground">SKU: {part.sku}</p>
                  <p className="text-xs text-muted-foreground">
                    Costo: ${part.costoActual} · Precio: ${part.precioReferencial} · {stateLabels[part.estado]}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingPart(part)}>
                  Editar
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}