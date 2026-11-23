"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { UsuarioListado } from "../consultas";
import { normalizarBusquedaUsuario, rolesUsuario, type RolUsuario } from "../modelo";
import { AvatarUsuario } from "./avatar-usuario";
import { urlAvatar } from "../avatar";
import { FormularioAcceso } from "./formulario-acceso";
import { FormularioUsuario } from "./formulario-usuario";

const coloresRol = {
  ADMINISTRADOR: "bg-violet-500/15 text-violet-800 dark:text-violet-200",
  TECNICO: "bg-blue-500/15 text-blue-800 dark:text-blue-200",
  RECEPCIONISTA: "bg-cyan-500/15 text-cyan-900 dark:text-cyan-200",
  GERENTE: "bg-muted text-foreground",
} satisfies Record<RolUsuario, string>;

export function CatalogoUsuarios({ usuarios, administradorId }: { usuarios: UsuarioListado[]; administradorId: number }) {
  const [buscar, setBuscar] = useState("");
  const [rol, setRol] = useState("");
  const [estado, setEstado] = useState("");
  const consulta = normalizarBusquedaUsuario(buscar.trim());
  const resultados = usuarios.filter((usuario) => (!rol || usuario.rol === rol) &&
    (!estado || String(usuario.activo) === estado) &&
    normalizarBusquedaUsuario([usuario.nombre, usuario.apellido, usuario.username, usuario.DNI].join(" ")).includes(consulta));

  return <section className="mx-auto max-w-6xl space-y-5 px-4 py-6 md:px-8">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
      <FormularioUsuario />
    </header>
    {usuarios.length === 0 ? <p className="rounded-lg border p-5 text-muted-foreground">Todavía no hay usuarios registrados.</p> : <>
      <div className="grid gap-3 sm:grid-cols-[minmax(13rem,24rem)_minmax(9rem,14rem)_minmax(8rem,12rem)]">
        <div className="grid gap-2">
          <Label htmlFor="buscar-usuarios">Buscar usuarios</Label>
          <Input id="buscar-usuarios" type="search" placeholder="Nombre, usuario o CI / DNI" value={buscar}
            onChange={(evento) => setBuscar(evento.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="filtrar-rol-usuario">Rol</Label>
          <Select value={rol} onValueChange={(valor) => setRol(valor ?? "")}>
            <SelectTrigger id="filtrar-rol-usuario" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los roles</SelectItem>
              {Object.entries(rolesUsuario).map(([valor, etiqueta]) => <SelectItem key={valor} value={valor}>{etiqueta}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="filtrar-estado-usuario">Estado</Label>
          <Select value={estado} onValueChange={(valor) => setEstado(valor ?? "")}>
            <SelectTrigger id="filtrar-estado-usuario" className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los estados</SelectItem>
              <SelectItem value="true">Activo</SelectItem>
              <SelectItem value="false">Inactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {resultados.length === 0
        ? <p role="status" className="rounded-lg border p-5 text-muted-foreground">No hay usuarios que coincidan con los filtros.</p>
        : <div className="rounded-lg border">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>CI / DNI</TableHead>
              <TableHead>Teléfono</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {resultados.map((usuario) => <TableRow key={usuario.id}>
                <TableCell className="whitespace-normal">
                  <div className="flex items-center gap-3">
                    <AvatarUsuario nombre={usuario.nombre} apellido={usuario.apellido} src={urlAvatar(usuario.id, usuario.avatar)} />
                    <div className="min-w-0 break-words">
                      <p className="font-semibold">{usuario.nombre} {usuario.apellido}</p>
                      <p className="text-xs text-muted-foreground">{usuario.username}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={"inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " + coloresRol[usuario.rol]}>
                    {rolesUsuario[usuario.rol]}
                  </span>
                </TableCell>
                <TableCell>
                  <span className={"inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " +
                    (usuario.activo ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200" : "bg-muted text-muted-foreground")}>
                    {usuario.activo ? "Activo" : "Inactivo"}
                  </span>
                </TableCell>
                <TableCell className="tabular-nums">{usuario.DNI}</TableCell>
                <TableCell>{usuario.telefono ?? "Sin registrar"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap items-start justify-end gap-2">
                    <FormularioUsuario usuario={usuario} />
                    <FormularioAcceso usuario={usuario} esPropio={usuario.id === administradorId} />
                  </div>
                </TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </div>}
    </>}
  </section>;
}
