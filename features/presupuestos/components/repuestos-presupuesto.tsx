"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { mostrarExistencias } from "@/lib/existencias";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { importePartida, mostrarBs } from "../importes";
import type { OpcionRepuesto, PartidaPresupuesto } from "../modelo";

export function RepuestosPresupuesto({ partidas, catalogo, preciosGuardados, disabled, alCambiar }: {
  partidas: PartidaPresupuesto[];
  catalogo: OpcionRepuesto[];
  preciosGuardados: PartidaPresupuesto[];
  disabled: boolean;
  alCambiar: (partidas: PartidaPresupuesto[]) => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const inventario = new Map(catalogo.map((repuesto) => [repuesto.id, repuesto]));
  const precios = new Map(preciosGuardados.map((partida) => [partida.id, partida.precioUnitario]));
  const seleccionados = new Set(partidas.map((partida) => partida.id));
  const opciones = catalogo.filter((repuesto) => !seleccionados.has(repuesto.id)).map((repuesto) => ({
    ...repuesto,
    precioUnitario: precios.get(repuesto.id) ?? repuesto.precioUnitario,
  }));

  function agregar(repuesto: OpcionRepuesto | null) {
    if (!repuesto?.disponible || repuesto.stock < 1) return;
    const { id, nombre, precioUnitario } = repuesto;
    alCambiar([...partidas, { id, nombre, precioUnitario, cantidad: 1 }]);
    setBusqueda("");
  }

  return (
    <section aria-labelledby="titulo-repuestos-presupuesto" className="space-y-3">
      <h3 id="titulo-repuestos-presupuesto" className="font-semibold">Repuestos</h3>
      {catalogo.length > 0 ? (
        <div className="grid gap-2">
          <Label htmlFor="agregar-repuesto-presupuesto">Agregar repuesto</Label>
          <Combobox<OpcionRepuesto> items={opciones} value={null} inputValue={busqueda}
            itemToStringLabel={(repuesto) => repuesto.nombre + " " + repuesto.sku}
            onInputValueChange={setBusqueda} onValueChange={agregar} disabled={disabled}>
            <ComboboxInput id="agregar-repuesto-presupuesto" placeholder="Buscar por nombre o código" disabled={disabled} />
            <ComboboxContent>
              <ComboboxEmpty>No hay repuestos para esta búsqueda.</ComboboxEmpty>
              <ComboboxList>
                {(repuesto: OpcionRepuesto) => (
                  <ComboboxItem key={repuesto.id} value={repuesto} disabled={!repuesto.disponible || repuesto.stock === 0}>
                    <span className="min-w-0 flex-1 break-words">
                      <span className="block">{repuesto.nombre} · {repuesto.sku}</span>
                      <span className="block text-xs text-muted-foreground">
                        {!repuesto.disponible ? "No disponible" : repuesto.stock ? mostrarExistencias(repuesto) : "Sin stock"}
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">{mostrarBs(repuesto.precioUnitario)}</span>
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <p className="text-xs text-muted-foreground">Cotizar no reserva existencias.</p>
        </div>
      ) : <p className="rounded-lg border p-3 text-sm text-muted-foreground">El catálogo aún no tiene repuestos registrados.</p>}

      {partidas.length > 0 && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repuesto</TableHead>
                <TableHead>Unidades</TableHead>
                <TableHead className="text-right">Precio unitario</TableHead>
                <TableHead className="text-right">Importe</TableHead>
                <TableHead><span className="sr-only">Quitar repuesto</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partidas.map((partida) => {
                const repuesto = inventario.get(partida.id);
                const aviso = !repuesto?.disponible ? "No disponible para cotizar."
                  : partida.cantidad < 1 ? "Indica al menos una unidad."
                  : partida.cantidad > repuesto.stock ? "La cantidad supera el stock." : null;
                const avisoId = "stock-repuesto-" + partida.id;
                return (
                  <TableRow key={partida.id}>
                    <TableCell className="max-w-52 whitespace-normal break-words">
                      <p className="font-medium">{partida.nombre}</p>
                      {repuesto && <p className="text-xs text-muted-foreground">{repuesto.sku} · {mostrarExistencias(repuesto)}</p>}
                      {aviso && <p id={avisoId} className="text-xs text-destructive">{aviso}</p>}
                    </TableCell>
                    <TableCell>
                      <Input type="text" inputMode="numeric" className="w-16" aria-label={"Unidades de " + partida.nombre}
                        aria-invalid={Boolean(aviso)} aria-describedby={aviso ? avisoId : undefined}
                        value={partida.cantidad || ""} maxLength={4} disabled={disabled}
                        onChange={(evento) => {
                          const valor = evento.target.value;
                          if (/^\d{0,4}$/.test(valor)) {
                            alCambiar(partidas.map((actual) => actual.id === partida.id
                              ? { ...actual, cantidad: Number(valor) } : actual));
                          }
                        }} />
                    </TableCell>
                    <TableCell className="text-right">{mostrarBs(partida.precioUnitario)}</TableCell>
                    <TableCell className="text-right">{mostrarBs(importePartida(partida))}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="sm" disabled={disabled} aria-label={"Quitar repuesto " + partida.nombre}
                        onClick={() => alCambiar(partidas.filter((actual) => actual.id !== partida.id))}>Quitar</Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
