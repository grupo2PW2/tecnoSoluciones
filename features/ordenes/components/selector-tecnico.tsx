
"use client";

import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { consultarTecnicos } from "../api";
import { cuposTecnico } from "../modelo";

export function SelectorTecnico({ valor, alSeleccionar, opcional = false, disabled }: {
  valor: number | null;
  alSeleccionar: (id: number | null) => void;
  opcional?: boolean;
  disabled?: boolean;
}) {
  const id = useId();
  const consulta = useQuery({
    queryKey: ["tecnicos-ingreso"],
    queryFn: ({ signal }) => consultarTecnicos(signal),
    staleTime: 0,
  });
  const tecnicos = consulta.data ?? [];
  const opciones = tecnicos.map((tecnico) => ({
    value: String(tecnico.id),
    label: tecnico.etiqueta + " · " + tecnico.ordenesActivas + "/" + cuposTecnico +
      (tecnico.ordenesActivas >= cuposTecnico ? " (sin cupo)" : ""),
    disabled: tecnico.ordenesActivas >= cuposTecnico,
  }));
  if (opcional) opciones.unshift({ value: "sin-asignar", label: "Sin asignar", disabled: false });

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{opcional ? "Técnico (opcional)" : "Técnico"}</Label>
      <Select items={opciones} value={valor === null ? (opcional ? "sin-asignar" : null) : String(valor)}
        disabled={disabled || (!opcional && opciones.length === 0)}
        onValueChange={(seleccion) => alSeleccionar(!seleccion || seleccion === "sin-asignar" ? null : Number(seleccion))}>
        <SelectTrigger id={id} className="w-full"><SelectValue placeholder="Selecciona un técnico" /></SelectTrigger>
        <SelectContent>
          {opciones.map((opcion) => (
            <SelectItem key={opcion.value} value={opcion.value} disabled={opcion.disabled}>{opcion.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {consulta.isPending && <p role="status" className="text-muted-foreground">Consultando cupos…</p>}
      {consulta.isError && <div className="flex flex-wrap items-center gap-2">
        <p role="alert" className="text-destructive">{consulta.error.message}</p>
        <Button type="button" size="sm" variant="outline" disabled={disabled || consulta.isFetching}
          onClick={() => void consulta.refetch()}>Reintentar</Button>
      </div>}
      {consulta.isSuccess && !tecnicos.some((tecnico) => tecnico.ordenesActivas < cuposTecnico) &&
        <p role="status" className="text-muted-foreground">Por ahora no hay técnicos con cupo.</p>}
    </div>
  );
}
