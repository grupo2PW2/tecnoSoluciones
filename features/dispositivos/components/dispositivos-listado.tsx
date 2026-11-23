"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useDebounce } from "use-debounce";
import { PaginacionTabla } from "@/components/paginacion-tabla";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { obtenerEquiposPaginados } from "../queries";
import { TablaEquipos } from "./tabla-equipos";

type ResultadoEquipos = Awaited<ReturnType<typeof obtenerEquiposPaginados>>;

export function DispositivosListado() {
  const [texto, setTexto] = useState("");
  const [page, setPage] = useState(1);
  const consulta = texto.trim();
  const [buscar] = useDebounce(consulta, 400);
  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["dispositivos", { buscar, page }],
    queryFn: async ({ signal }): Promise<ResultadoEquipos> => {
      const parametros = new URLSearchParams({ buscar, page: String(page) });
      const respuesta = await fetch("/api/dispositivos?" + parametros, { signal });
      if (!respuesta.ok) throw new Error("No se pudieron consultar los dispositivos.");
      return respuesta.json();
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
  const actualizando = isFetching || buscar !== consulta;

  return <section className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-8">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <h1 className="text-2xl font-semibold tracking-tight">Dispositivos</h1>
      <Link href="/clientes" className={buttonVariants()}>Elegir cliente para registrar equipo</Link>
    </header>
    <div className="grid max-w-md gap-2">
      <Label htmlFor="buscar-dispositivos">Buscar dispositivos</Label>
      <Input id="buscar-dispositivos" type="search" value={texto} maxLength={100} placeholder="Marca, modelo, serie o cliente"
        onChange={(evento) => { setTexto(evento.target.value); setPage(1); }} />
    </div>
    {isPending ? <p role="status" className="text-muted-foreground">Cargando dispositivos…</p>
      : isError ? <div className="flex flex-wrap items-center gap-3">
        <p role="alert">No se pudieron consultar los dispositivos.</p>
        <Button variant="outline" onClick={() => void refetch()}>Reintentar</Button>
      </div> : data && <>
        {actualizando && <p role="status" className="text-sm text-muted-foreground">Actualizando resultados…</p>}
        {data.dispositivos.length > 0 ? <TablaEquipos equipos={data.dispositivos} mostrarCliente />
          : <p role="status" className="rounded-lg border p-5 text-muted-foreground">
            {buscar ? "No hay dispositivos que coincidan con la búsqueda." : "Todavía no hay dispositivos registrados."}
          </p>}
        <PaginacionTabla pagina={data.pagina} totalPaginas={data.totalPaginas} total={data.total} unidad="dispositivo"
          deshabilitada={actualizando} cambiarPagina={setPage} />
      </>}
  </section>;
}
