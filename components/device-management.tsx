"use client";

import { useActionState, useState } from "react";

import { saveDevice } from "@/app/(dashboard)/dispositivos/actions";
import type { FormState } from "@/app/(dashboard)/dispositivos/actions";
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

type DeviceType =
  | "COMPUTADORA"
  | "CELULAR"
  | "LAPTOP"
  | "NOTEBOOK"
  | "TABLET"
  | "SMARTWATCH"
  | "IMPRESORA"
  | "SCANNER"
  | "OTRO";

type Device = {
  id: number;
  tipo: DeviceType;
  marca: string;
  modelo: string;
  nroSerie: string | null;
  imgUrl: string | null;
  clienteId: number;
  cliente: {
    id: number;
    nombre: string;
  };
};

type ClientOption = {
  id: number;
  nombre: string;
};

const initialState: FormState = {};

const deviceTypeLabels: Record<DeviceType, string> = {
  COMPUTADORA: "Computadora",
  CELULAR: "Celular",
  LAPTOP: "Laptop",
  NOTEBOOK: "Notebook",
  TABLET: "Tablet",
  SMARTWATCH: "Smartwatch",
  IMPRESORA: "Impresora",
  SCANNER: "Scanner",
  OTRO: "Otro",
};

export function DeviceManagement({
  devices,
  clients,
}: {
  devices: Device[];
  clients: ClientOption[];
}) {
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [state, formAction, isPending] = useActionState(saveDevice, initialState);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{editingDevice ? "Editar dispositivo" : "Nuevo dispositivo"}</CardTitle>
          <CardDescription>
            Registra el equipo y vincúlalo con su cliente propietario.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Primero registra al menos un cliente.
            </p>
          ) : (
            <form
              key={editingDevice?.id ?? "new-device"}
              action={formAction}
              className="grid gap-4"
            >
              <input type="hidden" name="id" value={editingDevice?.id ?? ""} />
              <div className="grid gap-2">
                <Label htmlFor="clienteId">Cliente</Label>
                <select
                  id="clienteId"
                  name="clienteId"
                  defaultValue={editingDevice?.clienteId ?? ""}
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
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  name="tipo"
                  defaultValue={editingDevice?.tipo ?? "OTRO"}
                  className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                >
                  {Object.entries(deviceTypeLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="marca">Marca</Label>
                <Input id="marca" name="marca" defaultValue={editingDevice?.marca ?? ""} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="modelo">Modelo</Label>
                <Input id="modelo" name="modelo" defaultValue={editingDevice?.modelo ?? ""} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nroSerie">Número de serie</Label>
                <Input id="nroSerie" name="nroSerie" defaultValue={editingDevice?.nroSerie ?? ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="imgUrl">URL de imagen</Label>
                <Input id="imgUrl" name="imgUrl" type="url" defaultValue={editingDevice?.imgUrl ?? ""} />
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
                  {isPending ? "Guardando..." : editingDevice ? "Guardar cambios" : "Crear dispositivo"}
                </Button>
                {editingDevice ? (
                  <Button type="button" variant="outline" onClick={() => setEditingDevice(null)}>
                    Nuevo
                  </Button>
                ) : null}
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispositivos registrados</CardTitle>
          <CardDescription>{devices.length} equipos en el sistema.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {devices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay dispositivos registrados.</p>
          ) : (
            devices.map((device) => (
              <div key={device.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">
                    {deviceTypeLabels[device.tipo]} {device.marca} {device.modelo}
                  </p>
                  <p className="text-sm text-muted-foreground">Cliente: {device.cliente.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    Serie: {device.nroSerie ?? "Sin número de serie"}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingDevice(device)}>
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