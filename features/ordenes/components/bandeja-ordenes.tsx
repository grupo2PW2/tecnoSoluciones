
"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TicketIcon } from "lucide-react";
import { useDebounce } from "use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { consultarTicket } from "../actions";
import { consultarBandeja } from "../api";
import { estadosOrden, fechaIngreso, tiposIngreso, type EstadoOrden, type TicketIngreso } from "../modelo";
import { NuevaOrden } from "./nueva-orden";
import { DialogoAsignacion } from "./dialogo-asignacion";
import { VistaTicket } from "./vista-ticket";
import { EstadoOrdenEtiqueta } from "./estado-orden-etiqueta";

const filtrosEstado = { todos: "Todos los estados", ...estadosOrden };

export function BandejaOrdenes({ puedeRegistrar }: { puedeRegistrar: boolean }) {
  const [buscar, setBuscar] = useState("");
  const [busqueda] = useDebounce(buscar.trim(), 250);
  const [estado, setEstado] = useState<EstadoOrden | "todos">("todos");
  const [pagina, setPagina] = useState(1);
  const [ticket, setTicket] = useState<TicketIngreso | null>(null);
  const [errorTicket, setErrorTicket] = useState("");
  const [cargandoTicket, setCargandoTicket] = useState<number | null>(null);
  const origenFoco = useRef<HTMLElement | null>(null);
  const queryClient = useQueryClient();

  const consulta = useQuery({
    queryKey: ["ordenes", busqueda, estado, pagina],
    queryFn: ({ signal }) => consultarBandeja(busqueda, estado === "todos" ? "" : estado, pagina, signal),
    enabled: buscar.trim() === busqueda,
  });
  const cargando = buscar.trim() !== busqueda || consulta.isPending;
  const datos = consulta.data;

  async function abrirTicket(id: number, boton: HTMLButtonElement) {
    if (cargandoTicket !== null) return;
    origenFoco.current = boton;
    setCargandoTicket(id);
    setErrorTicket("");

    try {
      const respuesta = await consultarTicket(id);
      if ("ticket" in respuesta) setTicket(respuesta.ticket);
      else setErrorTicket(respuesta.error);
    } catch {
      setErrorTicket("No se pudo abrir el ticket. Inténtalo de nuevo.");
    } finally {
      setCargandoTicket(null);
    }
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Órdenes de servicio</h1>
        {puedeRegistrar && <NuevaOrden alGuardar={(nuevoTicket) => {
          origenFoco.current = null;
          setErrorTicket("");
          setTicket(nuevoTicket);
          void queryClient.invalidateQueries({ queryKey: ["ordenes"] });
        }} />}
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <div className="grid w-full max-w-sm gap-2">
          <Label htmlFor="buscar-ordenes">Buscar órdenes</Label>
          <Input id="buscar-ordenes" type="search" placeholder="Código, cliente o equipo"
            value={buscar} maxLength={100} onChange={(evento) => {
              setBuscar(evento.target.value);
              setPagina(1);
            }} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="estado-ordenes">Estado</Label>
          <Select items={filtrosEstado} value={estado} onValueChange={(valor) => {
            if (valor) {
              setEstado(valor);
              setPagina(1);
            }
          }}>
            <SelectTrigger id="estado-ordenes" className="min-w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(filtrosEstado).map(([valor, etiqueta]) => (
                <SelectItem key={valor} value={valor}>{etiqueta}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {errorTicket && <p role="alert" className="text-sm text-destructive">{errorTicket}</p>}
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
          <div className="rounded-lg border" aria-busy={consulta.isFetching}>
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Equipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>Ingreso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datos.ordenes.map((orden) => (
                  <TableRow key={orden.id}>
                    <TableCell className="font-semibold">{orden.codigo}</TableCell>
                    <TableCell>{orden.cliente}</TableCell>
                    <TableCell>{orden.equipo}</TableCell>
                    <TableCell>
                      <EstadoOrdenEtiqueta estado={orden.estado} />
                    </TableCell>
                    <TableCell>
                      {puedeRegistrar && orden.asignable
                        ? <DialogoAsignacion ordenId={orden.id} codigo={orden.codigo} />
                        : orden.tecnico}
                    </TableCell>
                    <TableCell>
                      <p>{fechaIngreso(orden.fechaIngreso)}</p>
                      {orden.tipoIngreso && <p className="text-xs text-muted-foreground">{tiposIngreso[orden.tipoIngreso]}</p>}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" nativeButton={false}
                          render={<Link href={"/ordenes/" + orden.id} />}
                          aria-label={"Ver orden " + orden.codigo}>Ver orden</Button>
                        {puedeRegistrar && <Button variant="outline" size="sm" disabled={cargandoTicket !== null}
                          onClick={(evento) => void abrirTicket(orden.id, evento.currentTarget)}
                          aria-label={"Ver ticket de " + orden.codigo}>
                          <TicketIcon /> {cargandoTicket === orden.id ? "Abriendo…" : "Ver ticket"}
                        </Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-muted-foreground" role="status">
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
          {busqueda || estado !== "todos" ? "No hay órdenes que coincidan con la búsqueda o el filtro." : "Todavía no hay órdenes registradas."}
        </p>
      )}

      <VistaTicket ticket={ticket} alCerrar={() => setTicket(null)} origenFoco={origenFoco} />
    </section>
  );
}
