"use client";

import { useActionState } from "react";

import { confirmDelivery, registerPayment } from "@/app/(dashboard)/ordenes/actions";
import type { FormState } from "@/app/(dashboard)/ordenes/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ReadyOrder = {
  id: number;
  codigo: string;
  descuentoAplicado: string;
  estadoPago: string;
  dispositivo: { marca: string; modelo: string; cliente: { nombre: string } };
  actividades: { estado: string; precioUnitario: string }[];
  movimientos: { tipo: string; detalleMovimientos: { cantidad: number; precioUnitario: string | null }[] }[];
};

const initialState: FormState = {};

function getTotals(order: ReadyOrder) {
  const services = order.actividades
    .filter((activity) => activity.estado === "FINALIZADO")
    .reduce((total, activity) => total + Number(activity.precioUnitario), 0);
  const parts = order.movimientos.reduce(
    (total, movement) => total + movement.detalleMovimientos.reduce(
      (subtotal, detail) => subtotal + detail.cantidad * Number(detail.precioUnitario ?? 0),
      0,
    ),
    0,
  );
  const subtotal = services + parts;
  const discount = Number(order.descuentoAplicado);

  return { services, parts, subtotal, discount, total: subtotal - discount };
}

export function OrderPayment({ orders }: { orders: ReadyOrder[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cobro y entrega</CardTitle>
        <CardDescription>Solo aparecen órdenes con trabajo técnico verificado.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay órdenes listas para entrega.</p>
        ) : (
          orders.map((order) => <PaymentOrder key={order.id} order={order} />)
        )}
      </CardContent>
    </Card>
  );
}

function PaymentOrder({ order }: { order: ReadyOrder }) {
  const [state, formAction, isPending] = useActionState(registerPayment, initialState);
  const totals = getTotals(order);
  const paid = order.estadoPago === "PAGADO";

  return (
    <div className="grid gap-3 rounded-lg border p-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:justify-between">
        <div>
          <p className="font-medium">{order.codigo}</p>
          <p className="text-sm text-muted-foreground">{order.dispositivo.marca} {order.dispositivo.modelo} · {order.dispositivo.cliente.nombre}</p>
        </div>
        <p className="font-semibold">Total: ${totals.total.toFixed(2)}</p>
      </div>
      <p className="text-sm text-muted-foreground">
        Servicios: ${totals.services.toFixed(2)} · Repuestos: ${totals.parts.toFixed(2)} · Descuento: ${totals.discount.toFixed(2)}
      </p>
      {!paid ? (
        <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="ordenId" value={order.id} />
          <div className="grid gap-1"><Label htmlFor={`descuento-${order.id}`}>Descuento</Label><Input id={`descuento-${order.id}`} name="descuentoAplicado" type="number" min="0" step="0.01" defaultValue="0.00" required /></div>
          <div className="grid gap-1"><Label htmlFor={`metodo-${order.id}`}>Método</Label><select id={`metodo-${order.id}`} name="metodoPago" defaultValue="EFECTIVO" className="h-8 rounded-lg border border-input bg-background px-2 text-sm"><option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="QR">QR</option></select></div>
          <Button type="submit" disabled={isPending}>{isPending ? "Registrando..." : "Registrar pago"}</Button>
        </form>
      ) : (
        <form action={confirmDelivery}>
          <input type="hidden" name="ordenId" value={order.id} />
          <Button type="submit">Confirmar entrega</Button>
        </form>
      )}
      {state.error ? <p className="text-sm text-destructive" aria-live="polite">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700" aria-live="polite">{state.success}</p> : null}
    </div>
  );
}