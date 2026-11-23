"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RepuestoInventario } from "@/features/inventario/modelo";
import { MiniaturaImagen } from "@/features/imagenes/components/miniatura-imagen";
import { mostrarImporteExacto } from "@/features/inventario/precios";
import { mostrarCajasYUnidades, mostrarUnidades } from "@/lib/existencias";
import { urlImagenRepuesto } from "../imagen";
import { estadosRepuesto, estadoRepuesto, normalizarBusquedaRepuesto } from "../modelo";
import { FormularioRepuesto } from "./formulario-repuesto";
import { IndicadorEstadoRepuesto } from "./indicador-estado-repuesto";

export function CatalogoRepuestos({ repuestos }: { repuestos: RepuestoInventario[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("");
  const consulta = normalizarBusquedaRepuesto(busqueda.trim());
  const resultados = repuestos.filter((repuesto) => (!estado || estadoRepuesto(repuesto) === estado) &&
    normalizarBusquedaRepuesto(repuesto.nombre + " " + repuesto.sku).includes(consulta));

  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Repuestos</h1>
        <div className="flex flex-wrap items-start gap-2">
          <Link href="/inventario#existencias" className={buttonVariants({ variant: "outline" })}>Ver existencias</Link>
          <FormularioRepuesto principal />
        </div>
      </header>
      {repuestos.length === 0 ? <p className="rounded-lg border p-6 text-muted-foreground">Todavía no hay repuestos registrados.</p>
        : <>
          <div className="grid gap-3 sm:grid-cols-[minmax(14rem,26rem)_minmax(10rem,14rem)]">
            <div className="grid gap-2">
              <Label htmlFor="buscar-repuesto">Buscar repuesto</Label>
              <Input id="buscar-repuesto" placeholder="Nombre o código" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="filtrar-estado-repuesto">Estado</Label>
              <Select value={estado} onValueChange={(valor) => setEstado(valor ?? "")}>
                <SelectTrigger id="filtrar-estado-repuesto" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  {Object.entries(estadosRepuesto).map(([valor, etiqueta]) => <SelectItem value={valor} key={valor}>{etiqueta}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {resultados.length === 0 ? <p role="status" className="rounded-lg border p-6 text-muted-foreground">No hay repuestos que coincidan con los filtros.</p>
            : <div className="rounded-lg border">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Repuesto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Existencias</TableHead>
                  <TableHead>Presentación</TableHead>
                  <TableHead className="text-right">Costo de referencia</TableHead>
                  <TableHead className="text-right">Precio de venta</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {resultados.map((repuesto) => <TableRow key={repuesto.id}>
                    <TableCell className="whitespace-normal">
                      <div className="flex items-center gap-3">
                        <MiniaturaImagen src={urlImagenRepuesto(repuesto.id, repuesto.imgUrl)} />
                        <div className="min-w-0 break-words">
                          <p className="font-semibold">{repuesto.nombre}</p>
                          <p className="text-xs text-muted-foreground">{repuesto.sku}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><IndicadorEstadoRepuesto estado={estadoRepuesto(repuesto)} /></TableCell>
                    <TableCell className="font-semibold tabular-nums">{mostrarCajasYUnidades(repuesto)}</TableCell>
                    <TableCell>{repuesto.unidadesCaja > 0 ? "Caja de " + mostrarUnidades(repuesto.unidadesCaja) : "Por unidad"}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{mostrarImporteExacto(repuesto.costoActual)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{mostrarImporteExacto(repuesto.precioVenta)}</TableCell>
                    <TableCell className="text-right"><FormularioRepuesto repuesto={repuesto} /></TableCell>
                  </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </>}
    </section>
  );
}
