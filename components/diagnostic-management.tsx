"use client";

import { useActionState } from "react";

import {
  assignOrder,
  completeTechnicalWork,
  registerPartConsumption,
  saveActivity,
  saveDiagnosis,
} from "@/app/(dashboard)/diagnosticos/actions";
import type { FormState } from "@/app/(dashboard)/diagnosticos/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Order = {
  id: number;
  codigo: string;
  diagnostico: string | null;
  estado: string;
  trabajoVerficado: boolean;
  dispositivo: { marca: string; modelo: string; cliente: { nombre: string } };
  servicio: { id: number; nombre: string; precioReferencial: string } | null;
  actividades: {
    id: number;
    observaciones: string | null;
    precioUnitario: string;
    estado: string;
    servicio: { nombre: string };
  }[];
};

type Part = { id: number; sku: string; nombre: string; stock: number };

const initialState: FormState = {};

export function DiagnosticManagement({
  availableOrders,
  assignedOrders,
  canAssign,
  parts,
}: {
  availableOrders: Order[];
  assignedOrders: Order[];
  canAssign: boolean;
  parts: Part[];
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      {canAssign ? (
        <Card>
          <CardHeader>
            <CardTitle>Órdenes disponibles</CardTitle>
            <CardDescription>Autoasígnate órdenes mientras mantengas menos de dos activas.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {availableOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No hay órdenes libres.</p>
            ) : (
              availableOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 rounded-lg border p-3">
                  <div>
                    <p className="font-medium">{order.codigo}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.dispositivo.marca} {order.dispositivo.modelo} · {order.dispositivo.cliente.nombre}
                    </p>
                  </div>
                  <form action={assignOrder}>
                    <input type="hidden" name="ordenId" value={order.id} />
                    <Button type="submit" size="sm">Asignarme</Button>
                  </form>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      <Card className={canAssign ? "" : "xl:col-span-2"}>
        <CardHeader>
          <CardTitle>Diagnósticos asignados</CardTitle>
          <CardDescription>Registra el diagnóstico solo cuando hayas revisado el equipo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {assignedOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay órdenes asignadas.</p>
          ) : (
            assignedOrders.map((order) => <DiagnosisForm key={order.id} order={order} parts={parts} />)
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DiagnosisForm({ order, parts }: { order: Order; parts: Part[] }) {
  const [state, formAction, isPending] = useActionState(saveDiagnosis, initialState);
  const [activityState, activityAction, activityPending] = useActionState(saveActivity, initialState);
  const [consumptionState, consumptionAction, consumptionPending] = useActionState(registerPartConsumption, initialState);

  return (
    <div className="grid gap-3 rounded-lg border p-3">
      <form action={formAction} className="grid gap-3">
      <input type="hidden" name="ordenId" value={order.id} />
      <div>
        <p className="font-medium">{order.codigo}</p>
        <p className="text-sm text-muted-foreground">
          {order.dispositivo.marca} {order.dispositivo.modelo} · Estado: {order.estado}
        </p>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`diagnostico-${order.id}`}>Diagnóstico</Label>
        <Input
          id={`diagnostico-${order.id}`}
          name="diagnostico"
          defaultValue={order.diagnostico ?? ""}
          required
        />
      </div>
      {state.error ? <p className="text-sm text-destructive" aria-live="polite">{state.error}</p> : null}
      {state.success ? <p className="text-sm text-emerald-700" aria-live="polite">{state.success}</p> : null}
      <Button type="submit" variant="outline" disabled={isPending}>
        {isPending ? "Guardando..." : "Guardar diagnóstico"}
      </Button>
      </form>
      <div className="grid gap-3 border-t pt-3">
        <p className="text-sm font-medium">Actividades ejecutadas</p>
        {order.actividades.map((activity) => (
          <p key={activity.id} className="text-sm text-muted-foreground">
            {activity.servicio.nombre} · ${activity.precioUnitario}{activity.observaciones ? ` · ${activity.observaciones}` : ""}
          </p>
        ))}
        <form action={activityAction} className="grid gap-2">
          <input type="hidden" name="ordenId" value={order.id} />
          <select name="servicioId" defaultValue={order.servicio?.id ?? ""} className="h-8 rounded-lg border border-input bg-background px-2 text-sm" required>
            <option value="" disabled>Selecciona el servicio ejecutado</option>
            {order.servicio ? <option value={order.servicio.id}>{order.servicio.nombre}</option> : null}
          </select>
          <Input name="precioUnitario" type="number" min="0" step="0.01" defaultValue={order.servicio?.precioReferencial ?? "0.00"} required />
          <Input name="observaciones" placeholder="Observaciones del trabajo" />
          {activityState.error ? <p className="text-sm text-destructive" aria-live="polite">{activityState.error}</p> : null}
          {activityState.success ? <p className="text-sm text-emerald-700" aria-live="polite">{activityState.success}</p> : null}
          <Button type="submit" variant="outline" disabled={activityPending}>{activityPending ? "Registrando..." : "Registrar actividad"}</Button>
        </form>
        <form action={completeTechnicalWork}>
          <input type="hidden" name="ordenId" value={order.id} />
          <Button type="submit" disabled={order.actividades.length === 0 || order.trabajoVerficado}>
            {order.trabajoVerficado ? "Trabajo verificado" : "Marcar listo para entrega"}
          </Button>
        </form>
        <form action={consumptionAction} className="grid gap-2 border-t pt-3">
          <p className="text-sm font-medium">Consumir repuesto</p>
          <input type="hidden" name="ordenId" value={order.id} />
          <select name="repuestoId" defaultValue="" className="h-8 rounded-lg border border-input bg-background px-2 text-sm" required>
            <option value="" disabled>Selecciona un repuesto disponible</option>
            {parts.filter((part) => part.stock > 0).map((part) => (
              <option key={part.id} value={part.id}>{part.sku} · {part.nombre} · stock {part.stock}</option>
            ))}
          </select>
          <Input name="cantidad" type="number" min="1" step="1" required />
          {consumptionState.error ? <p className="text-sm text-destructive" aria-live="polite">{consumptionState.error}</p> : null}
          {consumptionState.success ? <p className="text-sm text-emerald-700" aria-live="polite">{consumptionState.success}</p> : null}
          <Button type="submit" variant="outline" disabled={consumptionPending}>{consumptionPending ? "Registrando..." : "Registrar consumo"}</Button>
        </form>
      </div>
    </div>
  );
}