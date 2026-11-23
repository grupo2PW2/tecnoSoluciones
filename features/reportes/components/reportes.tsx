"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "use-debounce";
import { PaginacionTabla } from "@/components/paginacion-tabla";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EstadoOrdenEtiqueta } from "@/features/ordenes/components/estado-orden-etiqueta";
import { estadosOrden, fechaIngreso } from "@/features/ordenes/modelo";
import { GraficoResumen } from "@/features/panel/components/graficos-dashboard";
import type { OrdenesReporte, TrabajoReporte } from "../consultas";
import { periodoReporteSchema, type FiltrosOrdenesReporte, type PeriodoReporte } from "../filtros";

const opcionesEstado = { todos: "Todos los estados", ...estadosOrden };
const numero = new Intl.NumberFormat("es-BO");

async function consultar<T>(params: Record<string, string>, signal: AbortSignal): Promise<T> {
  const respuesta = await fetch("/api/reportes?" + new URLSearchParams(params), { signal, cache: "no-store" });
  if (!respuesta.ok) {
    const mensaje = respuesta.status === 401 || respuesta.status === 403
      ? "Tu usuario no tiene permiso para consultar reportes."
      : "No se pudo cargar el reporte.";
    throw new Error(mensaje);
  }
  return respuesta.json();
}

function EstadoConsulta({ cargando, error, reintentar, children }: {
  cargando: boolean; error: Error | null; reintentar: () => void; children: ReactNode;
}) {
  if (cargando) return <div role="status" className="space-y-2">
    <p className="text-sm text-muted-foreground">Cargando resultados…</p>
    <Skeleton className="h-32 w-full" />
  </div>;

  if (error) return <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
    <p role="alert" className="text-sm text-destructive">{error.message}</p>
    <Button variant="outline" size="sm" onClick={reintentar}>Reintentar</Button>
  </div>;

  return children;
}

function TablaClasificacion({ id, titulo, detalle, etiquetaElemento, etiquetaCantidad, filas, vacio }: {
  id: string; titulo: string; detalle: string; etiquetaElemento: string; etiquetaCantidad: string;
  filas: { id: string | number; nombre: string; detalle?: string | null; cantidad: number }[];
  vacio: string;
}) {
  return <Card className="min-w-0">
    <CardHeader>
      <h2 id={id} className="font-semibold">{titulo}</h2>
      <p className="text-sm text-muted-foreground">{detalle}</p>
    </CardHeader>
    <CardContent>
      {filas.length === 0 ? <p className="text-sm text-muted-foreground">{vacio}</p> :
        <Table aria-labelledby={id}>
          <TableHeader><TableRow>
            <TableHead scope="col">{etiquetaElemento}</TableHead>
            <TableHead scope="col" className="text-right">{etiquetaCantidad}</TableHead>
          </TableRow></TableHeader>
          <TableBody>{filas.map((fila) => <TableRow key={fila.id}>
            <TableHead scope="row" className="whitespace-normal">
              {fila.nombre}
              {fila.detalle && <span className="block text-xs font-normal text-muted-foreground">{fila.detalle}</span>}
            </TableHead>
            <TableCell className="text-right font-semibold tabular-nums">{numero.format(fila.cantidad)}</TableCell>
          </TableRow>)}</TableBody>
        </Table>}
    </CardContent>
  </Card>;
}

function ReporteOrdenes({ datos, estado, cambiarEstado, cambiarPagina }: {
  datos?: OrdenesReporte;
  estado: FiltrosOrdenesReporte["estado"];
  cambiarEstado: (estado: FiltrosOrdenesReporte["estado"]) => void;
  cambiarPagina: (pagina: number) => void;
}) {
  return <Card className="min-w-0">
    <CardHeader>
      <h2 id="ordenes-reporte" className="font-semibold">Órdenes ingresadas en el periodo</h2>
      <p className="text-sm text-muted-foreground">El gráfico muestra el estado actual de todas las órdenes ingresadas en esas fechas.</p>
    </CardHeader>
    <CardContent className="space-y-4">
      {datos && <div className="max-w-lg">
        <p className="text-2xl font-bold tabular-nums">{numero.format(datos.totalPeriodo)} <span className="text-sm font-medium text-muted-foreground">{datos.totalPeriodo === 1 ? "orden ingresada" : "órdenes ingresadas"}</span></p>
        <GraficoResumen valores={datos.porEstado} vacio="No se registraron órdenes en este periodo." />
      </div>}
      <div className="grid w-fit gap-2">
        <Label htmlFor="estado-reporte">Estado de las órdenes en la tabla</Label>
        <Select items={opcionesEstado} value={estado} onValueChange={(valor) => { if (valor) cambiarEstado(valor); }}>
          <SelectTrigger id="estado-reporte" className="min-w-48"><SelectValue /></SelectTrigger>
          <SelectContent>{Object.entries(opcionesEstado).map(([valor, etiqueta]) =>
            <SelectItem key={valor} value={valor}>{etiqueta}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {datos && datos.totalPeriodo > 0 && (datos.ordenes.length === 0
        ? <p className="text-sm text-muted-foreground">No hay órdenes para los filtros seleccionados.</p>
        : <>
          <Table aria-labelledby="ordenes-reporte">
            <TableHeader><TableRow>
              <TableHead scope="col">Orden</TableHead>
              <TableHead scope="col">Ingreso</TableHead>
              <TableHead scope="col">Equipo</TableHead>
              <TableHead scope="col">Técnico</TableHead>
              <TableHead scope="col">Estado</TableHead>
            </TableRow></TableHeader>
            <TableBody>{datos.ordenes.map((orden) => <TableRow key={orden.id}>
              <TableHead scope="row">
                <Link href={"/ordenes/" + orden.id} className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{orden.codigo}</Link>
              </TableHead>
              <TableCell>{fechaIngreso(orden.fechaIngreso)}</TableCell>
              <TableCell>{orden.equipo}</TableCell>
              <TableCell>{orden.tecnico}</TableCell>
              <TableCell><EstadoOrdenEtiqueta estado={orden.estado} /></TableCell>
            </TableRow>)}</TableBody>
          </Table>
          <PaginacionTabla pagina={datos.pagina} total={datos.total} totalPaginas={datos.totalPaginas} unidad="orden" cambiarPagina={cambiarPagina} />
        </>)}
    </CardContent>
  </Card>;
}

export function Reportes({ periodoInicial }: { periodoInicial: PeriodoReporte }) {
  const [periodo, setPeriodo] = useState(periodoInicial);
  const [periodoConsulta] = useDebounce(periodo, 250);
  const [estado, setEstado] = useState<FiltrosOrdenesReporte["estado"]>("todos");
  const [pagina, setPagina] = useState(1);
  const validado = periodoReporteSchema.safeParse(periodo);
  const esperandoPeriodo = periodo.desde !== periodoConsulta.desde || periodo.hasta !== periodoConsulta.hasta;
  const habilitado = validado.success && !esperandoPeriodo;

  const ordenes = useQuery({
    queryKey: ["reportes", "ordenes", periodoConsulta, estado, pagina],
    queryFn: ({ signal }) => consultar<OrdenesReporte>({ ...periodoConsulta, vista: "ordenes", estado, pagina: String(pagina) }, signal),
    enabled: habilitado,
    retry: false,
  });
  const trabajo = useQuery({
    queryKey: ["reportes", "trabajo", periodoConsulta],
    queryFn: ({ signal }) => consultar<TrabajoReporte>({ ...periodoConsulta, vista: "trabajo" }, signal),
    enabled: habilitado,
    retry: false,
  });

  function cambiarFecha(campo: keyof PeriodoReporte, valor: string) {
    setPeriodo((anterior) => ({ ...anterior, [campo]: valor }));
    setPagina(1);
  }

  return <section className="mx-auto max-w-7xl space-y-5 px-4 py-6 md:px-8">
    <h1 className="text-2xl font-semibold tracking-tight">Reportes</h1>
    <Card>
      <CardHeader>
        <h2 className="font-semibold">Periodo del reporte</h2>
        <p className="text-sm text-muted-foreground">Incluye ambos días completos en hora de Bolivia.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-4">
          <div className="grid gap-2">
            <Label htmlFor="reporte-desde">Desde</Label>
            <Input id="reporte-desde" type="date" value={periodo.desde} onChange={(evento) => cambiarFecha("desde", evento.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="reporte-hasta">Hasta</Label>
            <Input id="reporte-hasta" type="date" value={periodo.hasta} onChange={(evento) => cambiarFecha("hasta", evento.target.value)} />
          </div>
        </div>
        {!validado.success && <p role="alert" className="text-sm text-destructive">{validado.error.issues[0].message}</p>}
      </CardContent>
    </Card>

    {validado.success && <>
      <ReporteOrdenes datos={habilitado && !ordenes.isError ? ordenes.data : undefined} estado={estado}
        cambiarEstado={(valor) => { setEstado(valor); setPagina(1); }} cambiarPagina={setPagina} />
      <EstadoConsulta cargando={esperandoPeriodo || ordenes.isPending} error={ordenes.error} reintentar={() => { void ordenes.refetch(); }}>
        {null}
      </EstadoConsulta>
      <EstadoConsulta cargando={esperandoPeriodo || trabajo.isPending} error={trabajo.error} reintentar={() => { void trabajo.refetch(); }}>
        {trabajo.data && <div className="grid items-start gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <TablaClasificacion id="reporte-tecnicos" titulo="Trabajo por técnico"
            detalle="Reparaciones que llegaron a Listo para entrega, por fecha de cierre técnico."
            etiquetaElemento="Técnico" etiquetaCantidad="Reparaciones"
            filas={trabajo.data.tecnicos.map(({ id, nombre, total }) => ({ id: id ?? "sin-tecnico", nombre, cantidad: total }))}
            vacio="No se completaron reparaciones en este periodo." />
          <TablaClasificacion id="reporte-equipos" titulo="Equipos más reparados"
            detalle="Reparaciones completadas en el periodo, agrupadas por tipo, marca y modelo."
            etiquetaElemento="Equipo" etiquetaCantidad="Reparaciones"
            filas={trabajo.data.equipos.map(({ id, nombre, tipo, total }) => ({ id, nombre, detalle: tipo, cantidad: total }))}
            vacio="No hay equipos reparados en este periodo." />
          <TablaClasificacion id="reporte-repuestos" titulo="Repuestos utilizados"
            detalle="Unidades registradas en salidas por reparación durante el periodo."
            etiquetaElemento="Repuesto" etiquetaCantidad="Unidades"
            filas={trabajo.data.repuestos.map(({ id, nombre, sku, unidades }) => ({ id, nombre, detalle: sku, cantidad: unidades }))}
            vacio="No se registraron salidas por reparación en este periodo." />
        </div>}
      </EstadoConsulta>
    </>}
  </section>;
}
