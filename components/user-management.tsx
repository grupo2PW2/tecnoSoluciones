"use client";

import { useActionState, useState } from "react";

import { saveUser, toggleUser } from "@/app/(dashboard)/usuarios/actions";
import type { UserFormState } from "@/app/(dashboard)/usuarios/actions";
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

type User = {
  id: number;
  nombre: string;
  DNI: string;
  username: string;
  activo: boolean;
  rol: "ADMINISTRADOR" | "TECNICO" | "RECEPCIONISTA" | "GERENTE";
};

const initialState: UserFormState = {};

const roleLabels: Record<User["rol"], string> = {
  ADMINISTRADOR: "Administrador",
  TECNICO: "Técnico",
  RECEPCIONISTA: "Recepción",
  GERENTE: "Gerente",
};

export function UserManagement({ users }: { users: User[] }) {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [state, formAction, isPending] = useActionState(saveUser, initialState);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader>
          <CardTitle>{editingUser ? "Editar usuario" : "Nuevo usuario"}</CardTitle>
          <CardDescription>
            {editingUser
              ? "Actualiza los datos y permisos del usuario seleccionado."
              : "Crea una cuenta para el personal del sistema."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="grid gap-4">
            <input type="hidden" name="id" value={editingUser?.id ?? ""} />
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre completo</Label>
              <Input id="nombre" name="nombre" defaultValue={editingUser?.nombre ?? ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="DNI">DNI</Label>
              <Input id="DNI" name="DNI" defaultValue={editingUser?.DNI ?? ""} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                name="username"
                defaultValue={editingUser?.username ?? ""}
                autoComplete="username"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">
                Contraseña{editingUser ? " nueva (opcional)" : ""}
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required={!editingUser}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="rol">Rol</Label>
              <select
                id="rol"
                name="rol"
                defaultValue={editingUser?.rol ?? "TECNICO"}
                className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="activo"
                defaultChecked={editingUser?.activo ?? true}
              />
              Usuario activo
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
                {isPending ? "Guardando..." : editingUser ? "Guardar cambios" : "Crear usuario"}
              </Button>
              {editingUser ? (
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios registrados</CardTitle>
          <CardDescription>{users.length} cuentas en el sistema.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay usuarios registrados.</p>
          ) : (
            users.map((user) => (
              <div
                key={user.id}
                className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{user.nombre}</p>
                  <p className="text-sm text-muted-foreground">
                    @{user.username} · {roleLabels[user.rol]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.activo ? "Activo" : "Inactivo"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditingUser(user)}>
                    Editar
                  </Button>
                  <form action={toggleUser}>
                    <input type="hidden" name="id" value={user.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      {user.activo ? "Desactivar" : "Activar"}
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