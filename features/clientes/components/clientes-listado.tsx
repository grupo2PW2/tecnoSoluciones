"use client";

import Link from "next/link";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { PaginacionTabla } from "@/components/paginacion-tabla";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientes } from "../hooks/use-clientes";
import { ClientesTable } from "./clientes-table";
import { DialogoCliente } from "./dialogo-cliente";

export function ClientesListado() {
  const [buscar, setBuscar] = useState("");
  const [page, setPage] = useState(1);
  const consulta = buscar.trim();
  const [busqueda] = useDebounce(consulta, 400);
  const { data, isPending, isFetching, isError, refetch } = useClientes({ buscar: busqueda, page });
  const actualizando = isFetching || busqueda !== consulta;

  return (
    <section className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <div className="flex flex-wrap gap-2">
          <Link href="/dispositivos" className={buttonVariants({ variant: "outline" })}>Ver dispositivos</Link>
          <DialogoCliente principal alGuardar={() => setPage(1)} />
        </div>
      </header>
      <div className="grid max-w-md gap-2">
        <Label htmlFor="buscar-clientes">Buscar clientes</Label>
        <Input id="buscar-clientes" type="search" value={buscar} maxLength={100} placeholder="Nombre, apellido o teléfono"
          onChange={(evento) => {
            setBuscar(evento.target.value);
            setPage(1);
          }} />
      </div>
      {isPending ? <p role="status" className="text-muted-foreground">Cargando clientes…</p>
        : isError ? <div className="flex flex-wrap items-center gap-3">
          <p role="alert">No se pudieron consultar los clientes.</p>
          <Button variant="outline" onClick={() => void refetch()}>Reintentar</Button>
        </div> : data && <>
          {actualizando && <p role="status" className="text-sm text-muted-foreground">Actualizando resultados…</p>}
          {data.clientes.length > 0 ? <ClientesTable clientes={data.clientes} />
            : <p role="status" className="rounded-lg border p-5 text-muted-foreground">
              {busqueda ? "No hay clientes que coincidan con la búsqueda." : "Todavía no hay clientes registrados."}
            </p>}
          <PaginacionTabla pagina={data.pagina} totalPaginas={data.totalPaginas} total={data.total} unidad="cliente"
            deshabilitada={actualizando} cambiarPagina={setPage} />
        </>}
    </section>
  );
}
