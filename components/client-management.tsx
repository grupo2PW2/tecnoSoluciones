"use client";

import { useActionState, useState } from "react";

import {
  deleteContact,
  saveClient,
  saveContact,
} from "@/app/(dashboard)/clientes/actions";
import type { FormState } from "@/app/(dashboard)/clientes/actions";
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

type Contact = {
  id: number;
  tipo:
    | "TELEFONO"
    | "CORREO"
    | "WHATSAPP"
    | "FACEBOOK"
    | "INSTAGRAM"
    | "LINKEDIN"
    | "OTRO";
  valor: string;
  principal: boolean;
};

type Client = {
  id: number;
  nombre: string;
  ciudad: string;
  direccion: string | null;
  contactos: Contact[];
};

const initialState: FormState = {};

const contactTypeLabels: Record<Contact["tipo"], string> = {
  TELEFONO: "Teléfono",
  CORREO: "Correo",
  WHATSAPP: "WhatsApp",
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  LINKEDIN: "LinkedIn",
  OTRO: "Otro",
};

export function ClientManagement({ clients }: { clients: Client[] }) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [clientState, clientAction, clientPending] = useActionState(saveClient, initialState);
  const [contactState, contactAction, contactPending] = useActionState(
    saveContact,
    initialState,
  );

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.4fr)]">
      <div className="grid content-start gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{selectedClient ? "Editar cliente" : "Nuevo cliente"}</CardTitle>
            <CardDescription>
              Registra los datos básicos para relacionar sus dispositivos y órdenes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              key={selectedClient?.id ?? "new-client"}
              action={clientAction}
              className="grid gap-4"
            >
              <input type="hidden" name="id" value={selectedClient?.id ?? ""} />
              <div className="grid gap-2">
                <Label htmlFor="nombre">Nombre completo</Label>
                <Input id="nombre" name="nombre" defaultValue={selectedClient?.nombre ?? ""} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input id="ciudad" name="ciudad" defaultValue={selectedClient?.ciudad ?? ""} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input id="direccion" name="direccion" defaultValue={selectedClient?.direccion ?? ""} />
              </div>
              {clientState.error ? (
                <p className="text-sm text-destructive" aria-live="polite">
                  {clientState.error}
                </p>
              ) : null}
              {clientState.success ? (
                <p className="text-sm text-emerald-700" aria-live="polite">
                  {clientState.success}
                </p>
              ) : null}
              <div className="flex gap-2">
                <Button type="submit" disabled={clientPending}>
                  {clientPending ? "Guardando..." : selectedClient ? "Guardar cambios" : "Crear cliente"}
                </Button>
                {selectedClient ? (
                  <Button type="button" variant="outline" onClick={() => setSelectedClient(null)}>
                    Nuevo
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>

        {selectedClient ? (
          <Card>
            <CardHeader>
              <CardTitle>{editingContact ? "Editar contacto" : "Nuevo contacto"}</CardTitle>
              <CardDescription>
                Los valores de contacto deben ser únicos en el sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                key={`${selectedClient.id}-${editingContact?.id ?? "new-contact"}`}
                action={contactAction}
                className="grid gap-4"
              >
                <input type="hidden" name="clienteId" value={selectedClient.id} />
                <input type="hidden" name="contactId" value={editingContact?.id ?? ""} />
                <div className="grid gap-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <select
                    id="tipo"
                    name="tipo"
                    defaultValue={editingContact?.tipo ?? "TELEFONO"}
                    className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
                  >
                    {Object.entries(contactTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="valor">Valor</Label>
                  <Input id="valor" name="valor" defaultValue={editingContact?.valor ?? ""} required />
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="principal"
                    defaultChecked={editingContact?.principal ?? selectedClient.contactos.length === 0}
                  />
                  Contacto principal
                </label>
                {contactState.error ? (
                  <p className="text-sm text-destructive" aria-live="polite">
                    {contactState.error}
                  </p>
                ) : null}
                {contactState.success ? (
                  <p className="text-sm text-emerald-700" aria-live="polite">
                    {contactState.success}
                  </p>
                ) : null}
                <div className="flex gap-2">
                  <Button type="submit" disabled={contactPending}>
                    {contactPending ? "Guardando..." : editingContact ? "Guardar contacto" : "Agregar contacto"}
                  </Button>
                  {editingContact ? (
                    <Button type="button" variant="outline" onClick={() => setEditingContact(null)}>
                      Cancelar
                    </Button>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Clientes registrados</CardTitle>
          <CardDescription>{clients.length} clientes en el sistema.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {clients.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay clientes registrados.</p>
          ) : (
            clients.map((client) => (
              <div key={client.id} className="rounded-lg border p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-medium">{client.nombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {client.ciudad}{client.direccion ? ` · ${client.direccion}` : ""}
                    </p>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedClient(client)}>
                    Gestionar
                  </Button>
                </div>
                <div className="mt-3 grid gap-2 border-t pt-3">
                  {client.contactos.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Sin contactos registrados.</p>
                  ) : (
                    client.contactos.map((contact) => (
                      <div key={contact.id} className="flex items-center justify-between gap-2 text-sm">
                        <p className="min-w-0 truncate">
                          <span className="text-muted-foreground">{contactTypeLabels[contact.tipo]}:</span>{" "}
                          {contact.valor}{contact.principal ? " · Principal" : ""}
                        </p>
                        {selectedClient?.id === client.id ? (
                          <div className="flex shrink-0 gap-1">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingContact(contact)}>
                              Editar
                            </Button>
                            <form action={deleteContact}>
                              <input type="hidden" name="contactId" value={contact.id} />
                              <Button type="submit" variant="ghost" size="sm">
                                Eliminar
                              </Button>
                            </form>
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}