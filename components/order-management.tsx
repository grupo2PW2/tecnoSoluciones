"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";

import { createOrder } from "@/app/(dashboard)/ordenes/actions";
import type { FormState } from "@/app/(dashboard)/ordenes/actions";
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

type Client = { id: number; nombre: string };
type Device = { id: number; clienteId: number; tipo: string; marca: string; modelo: string };
type Service = { id: number; nombre: string; precioReferencial: string };
type Order = {
  id: number;
  codigo: string;
  codigoCliente: string;
  problemasReportados: string;
  prioridad: string;
  estado: string;
  dispositivo: { marca: string; modelo: string; cliente: { nombre: string } };
  servicio: { nombre: string } | null;
};

const initialState: FormState = {};

const priorityLabels: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
};

const statusLabels: Record<string, string> = {
  RECIBIDO: "Recibido",
  EN_PROCESO: "En proceso",
  DIAGNOSTICADO: "Diagnosticado",
  PENDIENTE_APROBACION: "Pendiente de aprobación",
  RECHAZADO: "Rechazado",
  EN_REPARACION: "En reparación",
  LISTO_PARA_ENTREGA: "Listo para entrega",
  ENTREGADO: "Entregado",
};

export function OrderManagement({
  clients,
  devices,
  services,
  orders,
}: {
  clients: Client[];
  devices: Device[];
  services: Service[];
  orders: Order[];
}) {
  const [state, formAction, isPending] = useActionState(createOrder, initialState);
  const [selectedClientId, setSelectedClientId] = useStateValue("");
  const availableDevices = useMemo(
    () => devices.filter((device) => String(device.clienteId) === selectedClientId),
    [devices, selectedClientId],
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Nueva orden</CardTitle>
          <CardDescription>
            Registra la recepción del equipo y entrega el código privado de consulta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 || devices.length === 0 || services.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Necesitas al menos un cliente, un dispositivo y un servicio activo.
            </p>
          ) : (
            <form action={formAction} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="clienteId">Cliente</Label>
                <select
                  id="clienteId"
                  name="clienteId"
                  value={selectedClientId}
                  onChange={(event) => setSelectedClientId(event.target.value)}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                  required
                >
                  <option value="" disabled>
                    Selecciona un cliente
                  </option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dispositivoId">Dispositivo</Label>
                <select
                  id="dispositivoId"
                  name="dispositivoId"
                  defaultValue=""
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                  required
                >
                  <option value="" disabled>
                    Selecciona un dispositivo
                  </option>
                  {availableDevices.map((device) => (
                    <option key={device.id} value={device.id}>
                      {device.marca} {device.modelo} · {device.tipo}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="servicioId">Servicio solicitado</Label>
                <select id="servicioId" name="servicioId" defaultValue="" className="h-8 rounded-lg border border-input bg-background px-2 text-sm" required>
                  <option value="" disabled>
                    Selecciona un servicio
                  </option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.nombre} · ${service.precioReferencial}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="problemasReportados">Problemas reportados</Label>
                <textarea id="problemasReportados" name="problemasReportados" className="min-h-20 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="condicionDispositivo">Condición del dispositivo</Label>
                <Input id="condicionDispositivo" name="condicionDispositivo" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="accesoriosRecibidos">Accesorios recibidos</Label>
                <Input id="accesoriosRecibidos" name="accesoriosRecibidos" />
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="prioridad">Prioridad</Label>
                  <select id="prioridad" name="prioridad" defaultValue="BAJA" className="h-8 rounded-lg border border-input bg-background px-2 text-sm">
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="fechaEstimada">Fecha estimada</Label>
                  <Input id="fechaEstimada" name="fechaEstimada" type="date" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Input id="observaciones" name="observaciones" />
              </div>
              {state.error ? <p className="text-sm text-destructive" aria-live="polite">{state.error}</p> : null}
              {state.success ? <p className="text-sm text-emerald-700" aria-live="polite">{state.success}</p> : null}
              <Button type="submit" disabled={isPending}>{isPending ? "Registrando..." : "Registrar orden"}</Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Órdenes registradas</CardTitle>
          <CardDescription>{orders.length} órdenes en el sistema.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay órdenes registradas.</p>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="rounded-lg border p-3">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="font-medium">{order.codigo} · {order.dispositivo.marca} {order.dispositivo.modelo}</p>
                  <p className="text-sm text-muted-foreground">{statusLabels[order.estado] ?? order.estado}</p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Cliente: {order.dispositivo.cliente.nombre} · Prioridad: {priorityLabels[order.prioridad] ?? order.prioridad}
                </p>
                <p className="text-sm">{order.problemasReportados}</p>
                <p className="text-xs text-muted-foreground">Código privado: {order.codigoCliente}</p>
                <Link href={`/ordenes/${order.id}/ticket`} className="mt-3 inline-flex text-sm font-medium underline underline-offset-4 print:hidden">
                  Abrir ticket de recepción
                </Link>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function useStateValue(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  return [value, setValue] as const;
}