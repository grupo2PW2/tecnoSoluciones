"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mostrarBs } from "@/features/presupuestos/importes";
import type { ServicioListado } from "../consultas";
import { normalizarNombreServicio } from "../modelo";
import { FormularioServicio } from "./formulario-servicio";

export function CatalogoServicios({ servicios }: { servicios: ServicioListado[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const consulta = normalizarNombreServicio(busqueda.trim());
  const resultados = servicios.filter((servicio) => (!estado || String(servicio.activo) === estado) &&
    normalizarNombreServicio(servicio.nombre + " " + (servicio.descripcion ?? "")).includes(consulta));

  return (
    <section className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Servicios</h1>
        <FormularioServicio />
      </header>

      {servicios.length === 0 ? <p className="rounded-lg border p-6 text-muted-foreground">Todavía no hay servicios registrados.</p>
        : <>
          <div className="grid gap-3 sm:grid-cols-[minmax(14rem,26rem)_minmax(10rem,14rem)]">
            <div className="grid gap-2">
              <Label htmlFor="buscar-servicio">Buscar servicio</Label>
              <Input id="buscar-servicio" placeholder="Nombre o descripción" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="filtrar-estado-servicio">Estado</Label>
              <Select value={estado} onValueChange={(valor) => setEstado(valor ?? "")}>
                <SelectTrigger id="filtrar-estado-servicio" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {resultados.length === 0 ? <p role="status" className="rounded-lg border p-6 text-muted-foreground">No hay servicios que coincidan con los filtros.</p>
            : <div className="rounded-lg border">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Tarifa de referencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {resultados.map((servicio) => <TableRow key={servicio.id}>
                    <TableCell className="whitespace-normal break-words">
                      <p className="font-semibold">{servicio.nombre}</p>
                      {servicio.descripcion && <p className="text-sm text-muted-foreground">{servicio.descripcion}</p>}
                    </TableCell>
                    <TableCell>
                      <span className={"inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " +
                        (servicio.activo ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200" : "bg-muted text-muted-foreground")}>
                        {servicio.activo ? "Activo" : "Inactivo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{mostrarBs(servicio.precioReferencial)}</TableCell>
                    <TableCell className="text-right"><FormularioServicio servicio={servicio} /></TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </>}
    </section>
  );
}
