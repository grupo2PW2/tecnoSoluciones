"use client";

import { useActionState } from "react";

import { saveStockMinimum } from "@/app/(dashboard)/inventario/actions";
import type { FormState } from "@/app/(dashboard)/inventario/actions";
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

type InventoryItem = {
  repuestoId: number;
  sku: string;
  nombre: string;
  stock: number;
  stockMinimo: number;
};

const initialState: FormState = {};

export function InventoryManagement({ items }: { items: InventoryItem[] }) {
  const [state, formAction, isPending] = useActionState(saveStockMinimum, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Existencias</CardTitle>
        <CardDescription>
          El stock disponible se modifica únicamente mediante movimientos registrados.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay repuestos registrados.</p>
        ) : (
          items.map((item) => {
            const belowMinimum = item.stock <= item.stockMinimo;

            return (
              <div key={item.repuestoId} className="grid gap-3 rounded-lg border p-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <div>
                  <p className="font-medium">{item.nombre}</p>
                  <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  <p className={`text-sm ${belowMinimum ? "text-destructive" : "text-muted-foreground"}`}>
                    Stock actual: {item.stock} · {belowMinimum ? "Requiere reposición" : "Stock suficiente"}
                  </p>
                </div>
                <form action={formAction} className="flex items-end gap-2">
                  <input type="hidden" name="repuestoId" value={item.repuestoId} />
                  <div className="grid gap-1">
                    <Label htmlFor={`stockMinimo-${item.repuestoId}`}>Stock mínimo</Label>
                    <Input
                      id={`stockMinimo-${item.repuestoId}`}
                      name="stockMinimo"
                      type="number"
                      min="0"
                      step="1"
                      defaultValue={item.stockMinimo}
                      className="w-28"
                      required
                    />
                  </div>
                  <Button type="submit" variant="outline" disabled={isPending}>
                    Guardar
                  </Button>
                </form>
              </div>
            );
          })
        )}
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
      </CardContent>
    </Card>
  );
}