"use client";

import { useActionState, useState } from "react";

import { saveService, toggleService } from "@/app/(dashboard)/servicios/actions";
import type { FormState } from "@/app/(dashboard)/servicios/actions";
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

type Service = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precioReferencial: string;
  activo: boolean;
};

const initialState: FormState = {};

export function ServiceManagement({ services }: { services: Service[] }) {
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [state, formAction, isPending] = useActionState(saveService, initialState);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{editingService ? "Editar servicio" : "Nuevo servicio"}</CardTitle>
          <CardDescription>
            Define el servicio y su precio de referencia para nuevas órdenes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            key={editingService?.id ?? "new-service"}
            action={formAction}
            className="grid gap-4"
          >
            <input type="hidden" name="id" value={editingService?.id ?? ""} />
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" defaultValue={editingService?.nombre ?? ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Input id="descripcion" name="descripcion" defaultValue={editingService?.descripcion ?? ""} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="precioReferencial">Precio referencial</Label>
              <Input
                id="precioReferencial"
                name="precioReferencial"
                type="number"
                min="0"
                step="0.01"
                defaultValue={editingService?.precioReferencial ?? "0.00"}
                required
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="activo" defaultChecked={editingService?.activo ?? true} />
              Servicio activo
            </label>
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
                {isPending ? "Guardando..." : editingService ? "Guardar cambios" : "Crear servicio"}
              </Button>
              {editingService ? (
                <Button type="button" variant="outline" onClick={() => setEditingService(null)}>
                  Nuevo
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Servicios registrados</CardTitle>
          <CardDescription>{services.length} servicios en el catálogo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay servicios registrados.</p>
          ) : (
            services.map((service) => (
              <div key={service.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">{service.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    {service.descripcion ?? "Sin descripción"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Precio: ${service.precioReferencial} · {service.activo ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingService(service)}>
                    Editar
                  </Button>
                  <form action={toggleService}>
                    <input type="hidden" name="id" value={service.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      {service.activo ? "Desactivar" : "Activar"}
                    </Button>
                  </form>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}