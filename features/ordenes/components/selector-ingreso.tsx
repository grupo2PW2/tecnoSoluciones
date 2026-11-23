
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import { consultarOpciones } from "../api";
import type { OpcionIngreso } from "../modelo";

interface Props {
  id: string;
  etiqueta: string;
  ejemplo: string;
  seleccion: OpcionIngreso | null;
  alSeleccionar: (valor: OpcionIngreso | null) => void;
  clienteId?: number;
  disabled?: boolean;
}

export function SelectorIngreso({ id, etiqueta, ejemplo, seleccion, alSeleccionar, clienteId, disabled }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [buscar, setBuscar] = useState("");
  const [busqueda] = useDebounce(buscar.trim(), 250);
  const consulta = useQuery({
    queryKey: ["seleccion-ingreso", clienteId ?? null, busqueda],
    queryFn: ({ signal }) => consultarOpciones(busqueda, clienteId, signal),
    enabled: abierto && !seleccion && !disabled,
  });

  if (seleccion) {
    return (
      <div className="grid gap-2">
        <p id={id} className="text-sm font-medium">{etiqueta}</p>
        <div aria-labelledby={id} role="group" className="flex items-center justify-between gap-2 rounded-md border px-3 py-1">
          <span className="break-words">{seleccion.etiqueta}</span>
          <Button type="button" variant="ghost" size="sm" disabled={disabled}
            aria-label={"Cambiar " + etiqueta.toLowerCase()} onClick={() => alSeleccionar(null)}>Cambiar</Button>
        </div>
      </div>
    );
  }

  const cargando = buscar.trim() !== busqueda || consulta.isPending;
  const opciones = cargando || consulta.isError ? [] : consulta.data ?? [];
  const estado = cargando ? "Buscando…" : consulta.isError
    ? consulta.error.message
    : opciones.length === 0 ? "No hay resultados." : "";

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Combobox<OpcionIngreso> items={opciones} filter={null} inputValue={buscar}
        itemToStringLabel={(opcion) => opcion.etiqueta}
        open={abierto}
        onOpenChange={setAbierto}
        onInputValueChange={setBuscar}
        onValueChange={(opcion) => {
          if (!opcion) return;
          setBuscar("");
          setAbierto(false);
          alSeleccionar(opcion);
        }}
        disabled={disabled}>
        <ComboboxInput id={id} placeholder={ejemplo} disabled={disabled} />
        <ComboboxContent>
          {estado && <p role={consulta.isError ? "alert" : "status"} className="p-2 text-sm text-muted-foreground">{estado}</p>}
          <ComboboxList>
            {(opcion: OpcionIngreso) => (
              <ComboboxItem key={opcion.id} value={opcion}>{opcion.etiqueta}</ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
