"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mostrarBs } from "@/features/presupuestos/importes";
import { estadoRepuesto, normalizarBusquedaRepuesto } from "@/features/repuestos/modelo";
import { IndicadorEstadoRepuesto } from "@/features/repuestos/components/indicador-estado-repuesto";
import { mostrarCajasYUnidades, mostrarUnidades } from "@/lib/existencias";
import { alertaStockMinimo, type RepuestoInventario } from "../modelo";
import { EditarStockMinimo } from "./editar-stock-minimo";

export function TablaExistencias({ repuestos }: { repuestos: RepuestoInventario[] }) {
  const [busqueda, setBusqueda] = useState("");
  const filtro = normalizarBusquedaRepuesto(busqueda.trim());
  const resultados = repuestos.filter((repuesto) => normalizarBusquedaRepuesto(repuesto.nombre + " " + repuesto.sku).includes(filtro));
  if (repuestos.length === 0) return <p className="text-sm text-muted-foreground">Da de alta un repuesto para empezar a registrar stock.</p>;

  return (
    <div className="space-y-4">
      <div className="grid max-w-md gap-2">
        <Label htmlFor="buscar-existencias">Buscar repuesto</Label>
        <Input id="buscar-existencias" placeholder="Nombre o código" value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} />
      </div>
      {resultados.length === 0 ? <p role="status" className="text-sm text-muted-foreground">No hay repuestos que coincidan con la búsqueda.</p>
        : <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repuesto</TableHead>
                <TableHead>Existencias</TableHead>
                <TableHead>Stock mínimo</TableHead>
                <TableHead>Unidades por caja</TableHead>
                <TableHead className="text-right">Costo de referencia</TableHead>
                <TableHead className="text-right">Precio de venta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resultados.map((repuesto) => {
                const stock = mostrarCajasYUnidades(repuesto);
                const unidades = mostrarUnidades(repuesto.stock);
                const alerta = alertaStockMinimo(repuesto);
                const bajoMinimo = alerta === "bajo-minimo";
                return (
                  <TableRow key={repuesto.id}>
                    <TableCell className="whitespace-normal">
                      <p className="font-medium">{repuesto.nombre}</p>
                      <p className="text-xs text-muted-foreground">{repuesto.sku}</p>
                    </TableCell>
                    <TableCell>
                      <p className="font-semibold tabular-nums">{stock}</p>
                      {stock !== unidades && <p className="text-xs text-muted-foreground">{unidades} en total</p>}
                      {alerta && <span className={"mt-1.5 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " +
                        (bajoMinimo ? "bg-red-500/15 text-red-800 dark:text-red-200" : "bg-amber-500/15 text-amber-900 dark:text-amber-200")}>
                        {bajoMinimo ? "Bajo el mínimo" : "En el mínimo"}
                      </span>}
                    </TableCell>
                    <TableCell>
                      {repuesto.stockMinimo > 0
                        ? mostrarCajasYUnidades({ stock: repuesto.stockMinimo, unidadesCaja: repuesto.unidadesCaja })
                        : <span className="text-muted-foreground">Sin mínimo</span>}
                    </TableCell>
                    <TableCell>{repuesto.unidadesCaja > 0 ? repuesto.unidadesCaja : "Por unidad"}</TableCell>
                    <TableCell className="text-right">{mostrarBs(repuesto.costoActual)}</TableCell>
                    <TableCell className="text-right">{mostrarBs(repuesto.precioVenta)}</TableCell>
                    <TableCell><IndicadorEstadoRepuesto estado={estadoRepuesto(repuesto)} /></TableCell>
                    <TableCell className="text-right"><EditarStockMinimo repuesto={repuesto} /></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>}
    </div>
  );
}
