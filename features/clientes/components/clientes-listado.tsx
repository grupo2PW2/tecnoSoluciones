"use client";

import { useState } from "react";
import { useDebounce } from "use-debounce";

import { Input } from "@/components/ui/input";
import { ClientesTable } from "./clientes-table";

import { useClientes } from "../hooks/use-clientes";

export function ClientesListado() {
  const [buscar, setBuscar] = useState("");
  const [page, setPage] = useState(1);

  const [busqueda] = useDebounce(buscar.trim(), 400);

  const { data, isPending, isFetching, isError } = useClientes({
    buscar: busqueda,
    page,
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Clientes</h1>
        <p className="text-muted-foreground">Administración de clientes</p>
      </div>

      <Input
        type="search"
        value={buscar}
        onChange={(event) => {
          setBuscar(event.target.value);
          setPage(1);
        }}
        placeholder="Buscar por nombre, apellido o teléfono"
        aria-label="Buscar clientes"
        className="max-w-sm"
      />

      {isFetching && (
        <p className="text-sm text-muted-foreground">
          Actualizando resultados...
        </p>
      )}

      {isPending ? (
        <p>Cargando clientes...</p>
      ) : isError ? (
        <p role="alert">Ocurrió un error al consultar los clientes.</p>
      ) : data ? (
        <ClientesTable clientes={data.clientes} />
      ) : null}
    </section>
  );
}
