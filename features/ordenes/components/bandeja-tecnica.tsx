
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { tomarOrden } from "../actions";
import { consultarBandejaTecnica } from "../api";
import { cuposTecnico, fechaIngreso, tiposIngreso, type VistaTecnica } from "../modelo";
import type { ResultadoBandejaTecnica } from "../queries";
import { EstadoOrdenEtiqueta } from "./estado-orden-etiqueta";

const vistas = { disponibles: "Disponibles", "mis-ordenes": "Mis órdenes" } as const;
type OrdenTecnica = ResultadoBandejaTecnica["ordenes"][number];

export function BandejaTecnica({ tecnicoId, vistaInicial }: { tecnicoId: number; vistaInicial: VistaTecnica }) {
  const [vista, setVista] = useState<VistaTecnica>(vistaInicial);
  const [buscar, setBuscar] = useState("");
  const [busqueda] = useDebounce(buscar.trim(), 250);
  const [pagina, setPagina] = useState(1);
  const [seleccion, setSeleccion] = useState<OrdenTecnica | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorToma, setErrorToma] = useState("");
  const pendiente = useRef(false);
  const disparador = useRef<HTMLButtonElement | null>(null);
  const botonDisponibles = useRef<HTMLButtonElement>(null);
  const queryClient = useQueryClient();
  const consulta = useQuery({
    queryKey: ["bandeja-tecnica", tecnicoId, vista, busqueda, pagina],
    queryFn: ({ signal }) => consultarBandejaTecnica(vista, busqueda, pagina, signal),
    enabled: buscar.trim() === busqueda,
    staleTime: 0,
  });
  const datos = consulta.data;
  const cupoCompleto = datos !== undefined && datos.ordenesActivas >= cuposTecnico;
  const cargando = consulta.isPending || buscar.trim() !== busqueda;

  function cambiarVista(siguiente: VistaTecnica) {
    if (siguiente === vista) return;
    setVista(siguiente);
    setBuscar("");
    setPagina(1);
  }

  async function confirmarToma() {
    if (!seleccion || pendiente.current) return;
    pendiente.current = true;
    setGuardando(true);
    setErrorToma("");

    try {
      const resultado = await tomarOrden(seleccion.id);
      void queryClient.invalidateQueries({ queryKey: ["bandeja-tecnica", tecnicoId] });
      if ("error" in resultado) {
        setErrorToma(resultado.error ?? "No se pudo tomar la orden.");
        return;
      }

      notificarGuardado("Orden tomada", seleccion.codigo + " ya aparece en Mis órdenes.");
      disparador.current = null;
      setSeleccion(null);
      void queryClient.invalidateQueries({ queryKey: ["ordenes"] });
      void queryClient.invalidateQueries({ queryKey: ["tecnicos-ingreso"] });
    } catch {
      setErrorToma("No se pudo confirmar la toma de la orden. Inténtalo nuevamente.");
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Órdenes de servicio</h1>
        {datos && <p role="status" className="rounded-lg border px-3 py-2 text-sm">
          <strong>{datos.ordenesActivas} de {cuposTecnico}</strong> cupos ocupados
        </p>}
      </header>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div role="group" aria-label="Vistas de órdenes" className="flex gap-2">
          <Button ref={botonDisponibles} variant={vista === "disponibles" ? "default" : "outline"}
            aria-pressed={vista === "disponibles"} onClick={() => cambiarVista("disponibles")}>
            {vistas.disponibles}
          </Button>
          <Button variant={vista === "mis-ordenes" ? "default" : "outline"}
            aria-pressed={vista === "mis-ordenes"} onClick={() => cambiarVista("mis-ordenes")}>
            {vistas["mis-ordenes"]}
          </Button>
        </div>
        <div className="grid w-full max-w-sm gap-2">
          <Label htmlFor="buscar-orden-tecnica">Buscar órdenes</Label>
          <Input id="buscar-orden-tecnica" type="search" placeholder="Código, cliente o equipo"
            maxLength={100} value={buscar} onChange={(evento) => {
              setBuscar(evento.target.value);
              setPagina(1);
            }} />
        </div>
      </div>

      {vista === "disponibles" && cupoCompleto && (
        <p id="cupo-tecnico-completo" role="status" className="rounded-lg border bg-muted/40 px-4 py-2">
          Tus tres cupos están ocupados. Podrás tomar otra orden cuando liberes un cupo.
        </p>
      )}

      {cargando ? (
        <div role="status" className="space-y-2">
          <p className="text-sm text-muted-foreground">Cargando órdenes…</p>
          <Skeleton className="h-32 w-full" />
        </div>
      ) : consulta.isError ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
          <p role="alert" className="text-sm text-destructive">{consulta.error.message}</p>
          <Button variant="outline" size="sm" onClick={() => void consulta.refetch()}>Reintentar</Button>
        </div>
      ) : datos && datos.ordenes.length > 0 ? (
        <>
          <ul className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy={consulta.isFetching}>
            {datos.ordenes.map((orden) => (
              <li key={orden.id}>
                <Card className="h-full">
                  <CardHeader>
                    <p className="text-sm text-muted-foreground">{orden.codigo}</p>
                    <CardTitle className="break-words text-lg">{orden.equipo}</CardTitle>
                    <p className="text-sm">{orden.cliente}</p>
                    <div className="mt-1"><EstadoOrdenEtiqueta estado={orden.estado} /></div>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    {orden.problema && <p className="whitespace-pre-wrap break-words"><strong>Motivo del ingreso</strong><br />{orden.problema}</p>}
                    <p className="text-muted-foreground">
                      {orden.cierreTecnico ? "Cierre técnico · " : "Ingreso · "}
                      {fechaIngreso(orden.cierreTecnico ?? orden.fechaIngreso)}
                      {orden.tipoIngreso && <><br />{tiposIngreso[orden.tipoIngreso]}</>}
                    </p>
                  </CardContent>
                  {vista === "disponibles" && (
                    <CardFooter className="mt-auto">
                      <Button disabled={cupoCompleto}
                        aria-describedby={cupoCompleto ? "cupo-tecnico-completo" : undefined}
                        aria-label={"Tomar orden " + orden.codigo}
                        onClick={(evento) => {
                          disparador.current = evento.currentTarget;
                          setErrorToma("");
                          setSeleccion(orden);
                        }}>
                        Tomar orden
                      </Button>
                    </CardFooter>
                  )}
                  {vista === "mis-ordenes" && (
                    <CardFooter className="mt-auto">
                      <Button variant="outline" render={<Link href={"/ordenes/" + orden.id} />}
                        nativeButton={false} aria-label={"Ver orden " + orden.codigo}>
                        Ver orden
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p role="status" className="text-muted-foreground">
              {datos.total} {datos.total === 1 ? "orden" : "órdenes"} · Página {datos.pagina} de {datos.totalPaginas}
            </p>
            {datos.totalPaginas > 1 && <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={datos.pagina <= 1}
                onClick={() => setPagina(datos.pagina - 1)}>Anterior</Button>
              <Button variant="outline" size="sm" disabled={datos.pagina >= datos.totalPaginas}
                onClick={() => setPagina(datos.pagina + 1)}>Siguiente</Button>
            </div>}
          </div>
        </>
      ) : (
        <p role="status" className="rounded-lg border p-8 text-center text-muted-foreground">
          {busqueda ? "No hay órdenes que coincidan con la búsqueda." : vista === "disponibles"
            ? "Por ahora no hay órdenes disponibles." : "Todavía no tienes órdenes asignadas."}
        </p>
      )}

      <Dialog open={seleccion !== null} onOpenChange={(abierto) => {
        if (!abierto && !pendiente.current) setSeleccion(null);
      }}>
        <DialogContent showCloseButton={false} finalFocus={() =>
          disparador.current?.isConnected && !disparador.current.disabled
            ? disparador.current : botonDisponibles.current ?? true}>
          <DialogHeader>
            <DialogTitle>Tomar orden</DialogTitle>
            <DialogDescription>
              La orden {seleccion?.codigo} quedará a tu cargo y ocupará un cupo.
            </DialogDescription>
          </DialogHeader>
          {errorToma && <p role="alert" className="text-destructive">{errorToma}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={guardando} onClick={() => setSeleccion(null)}>Cancelar</Button>
            <Button disabled={guardando || cupoCompleto} onClick={() => void confirmarToma()}>
              {guardando ? "Tomando…" : "Confirmar toma"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
