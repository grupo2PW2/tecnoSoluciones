import Link from "next/link";
import {
  ArrowRightIcon, BanknoteIcon, ClipboardListIcon, PackageCheckIcon, PackageOpenIcon,
  ShoppingBagIcon, UserRoundPlusIcon, type LucideIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mostrarImporteExacto } from "@/features/inventario/precios";
import { EstadoOrdenEtiqueta } from "@/features/ordenes/components/estado-orden-etiqueta";
import { cuposTecnico, fechaIngreso, type EstadoOrden } from "@/features/ordenes/modelo";
import type { RolUsuario } from "@/features/usuarios/modelo";
import {
  consultarDashboardAdministracion, consultarDashboardGerencia, consultarDashboardRecepcion, consultarDashboardTecnico, equipoDashboard,
} from "../dashboard-consultas";
import { GraficoActividad, GraficoResumen } from "./graficos-dashboard";

const enlace = "inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-ring";

function Indicador({ titulo, valor, detalle, icono: Icono, ruta, alerta }: {
  titulo: string; valor: string | number; detalle?: string; icono: LucideIcon; ruta?: string; alerta?: boolean;
}) {
  return <Card className={alerta ? "border border-amber-500/35" : undefined}>
    <CardContent className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">{titulo}</h2>
        <Icono className={"size-4 shrink-0 " + (alerta ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground")} aria-hidden="true" />
      </div>
      <p className="break-words text-2xl font-bold tracking-tight tabular-nums">{valor}</p>
      {detalle && <p className="text-sm text-muted-foreground">{detalle}</p>}
      {ruta && <Link href={ruta} className={enlace}>Ver {ruta === "/ordenes" ? "órdenes" : ruta === "/inventario" ? "inventario" : "movimientos"} <ArrowRightIcon className="size-4" aria-hidden="true" /></Link>}
    </CardContent>
  </Card>;
}

type OrdenDashboard = Awaited<ReturnType<typeof consultarDashboardTecnico>>["ordenes"][number];

function accionTecnica(estado: EstadoOrden, tipo: OrdenDashboard["tipoIngreso"]) {
  switch (estado) {
    case "RECIBIDO": return tipo === "SERVICIO_DIRECTO" ? "Esperar confirmación en tienda" : "Iniciar diagnóstico";
    case "EN_DIAGNOSTICO": return "Revisar diagnóstico y presupuesto";
    case "PENDIENTE_APROBACION": return "Consultar el presupuesto";
    case "APROBADO": return "Revisar el trabajo autorizado";
    case "EN_REPARACION": return "Continuar el trabajo y verificarlo";
    default: return "Consultar el detalle";
  }
}

function ListaPendientes({ titulo, ordenes, vacio, tecnica }: {
  titulo: string; ordenes: OrdenDashboard[]; vacio: string; tecnica?: boolean;
}) {
  return <Card>
    <CardHeader className="flex flex-wrap items-center justify-between gap-2">
      <h2 className="font-semibold">{titulo}</h2>
      <Link href="/ordenes" className={enlace}>Abrir bandeja <ArrowRightIcon className="size-4" aria-hidden="true" /></Link>
    </CardHeader>
    <CardContent>
      {ordenes.length === 0 ? <p className="text-sm text-muted-foreground">{vacio}</p>
        : <ul className="divide-y">
          {ordenes.map((orden) => <li key={orden.id}>
            <Link href={"/ordenes/" + orden.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-md px-2 py-3 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring">
              <div className="min-w-0">
                <p className="font-semibold break-words">{equipoDashboard(orden.dispositivo)}</p>
                <p className="text-xs text-muted-foreground">{orden.codigo} · {fechaIngreso(orden.fechaIngreso)}</p>
                {tecnica && <p className="mt-1 text-sm font-medium">{accionTecnica(orden.estado, orden.tipoIngreso)}</p>}
              </div>
              <EstadoOrdenEtiqueta estado={orden.estado} />
            </Link>
          </li>)}
        </ul>}
    </CardContent>
  </Card>;
}

async function Administracion() {
  const datos = await consultarDashboardAdministracion();
  return <>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
      <Indicador titulo="Órdenes activas" valor={datos.activas} icono={ClipboardListIcon} ruta="/ordenes" />
      <Indicador titulo="Listas para entregar" valor={datos.listas} icono={PackageCheckIcon} ruta="/ordenes" />
      <Indicador titulo="Repuestos para reponer" valor={datos.bajoMinimo} detalle="En el mínimo o por debajo"
        icono={PackageOpenIcon} ruta="/inventario" alerta={datos.bajoMinimo > 0} />
      <Indicador titulo="Cobros de órdenes" valor={mostrarImporteExacto(datos.cobros)} detalle="Últimos 7 días"
        icono={BanknoteIcon} ruta="/ordenes" />
      <Indicador titulo="Ventas directas" valor={mostrarImporteExacto(datos.ventaDirecta)} detalle="Últimos 7 días"
        icono={ShoppingBagIcon} ruta="/movimientos" />
    </div>
    <Card className="min-w-0">
      <CardHeader>
        <h2 className="font-semibold">Órdenes recibidas y entregadas</h2>
        <p className="text-sm text-muted-foreground">Últimos 7 días · Hora de Bolivia</p>
      </CardHeader>
      <CardContent><GraficoActividad dias={datos.dias} /></CardContent>
    </Card>
    <ListaPendientes titulo="Por asignar" ordenes={datos.asignacion} vacio="No hay órdenes por asignar." />
  </>;
}

async function Recepcion() {
  const { hoy, pendientes } = await consultarDashboardRecepcion();
  return <>
    <div className="grid gap-3 sm:grid-cols-3">
      <Indicador titulo="Órdenes sin técnico" valor={pendientes.totales.sinTecnico}
        icono={UserRoundPlusIcon} ruta="/ordenes" alerta={pendientes.totales.sinTecnico > 0} />
      <Indicador titulo="Presupuestos por responder" valor={pendientes.totales.ofertas} icono={ClipboardListIcon} ruta="/ordenes" />
      <Indicador titulo="Listas para entregar" valor={pendientes.totales.listas} icono={PackageCheckIcon} ruta="/ordenes" />
    </div>
    <Card className="min-w-0">
      <CardHeader>
        <h2 className="font-semibold">Actividad de hoy</h2>
        <p className="text-sm text-muted-foreground">{hoy.dia} · Hora de Bolivia</p>
      </CardHeader>
      <CardContent><GraficoResumen valores={[{ etiqueta: "Recibidas", total: hoy.recibidas }, { etiqueta: "Entregadas", total: hoy.entregadas }]}
        vacio="Hoy todavía no se registraron ingresos ni entregas." /></CardContent>
    </Card>
    <div className="grid gap-4 xl:grid-cols-3">
      <ListaPendientes titulo="Por asignar" ordenes={pendientes.asignacion} vacio="No hay órdenes por asignar." />
      <ListaPendientes titulo="Ofertas vigentes" ordenes={pendientes.ofertas} vacio="No hay ofertas vigentes pendientes de respuesta." />
      <ListaPendientes titulo="Por entregar" ordenes={pendientes.porEntregar} vacio="No hay equipos listos para entregar." />
    </div>
  </>;
}

async function Tecnico({ id }: { id: number }) {
  const datos = await consultarDashboardTecnico(id);
  const ocupados = datos.ordenes.length;
  const libres = Math.max(0, cuposTecnico - ocupados);
  return <>
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <Indicador titulo="Cupos ocupados" valor={ocupados + " de " + cuposTecnico} icono={ClipboardListIcon} ruta="/ordenes"
        detalle={libres === 0 ? "Cupo completo" : libres === 1 ? "1 cupo disponible" : libres + " cupos disponibles"} alerta={libres === 0} />
      <Card className="min-w-0">
        <CardHeader><h2 className="font-semibold">Mis órdenes activas por estado</h2></CardHeader>
        <CardContent><GraficoResumen valores={datos.porEstado} vacio="Todavía no tienes órdenes activas." /></CardContent>
      </Card>
    </div>
    <ListaPendientes titulo="Mi trabajo pendiente" ordenes={datos.ordenes} vacio="Consulta las órdenes disponibles en la bandeja." tecnica />
  </>;
}

async function Gerencia() {
  const datos = await consultarDashboardGerencia();
  return <>
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-lg font-semibold">Resumen de Gerencia</h2>
      <Link href="/ordenes" className={enlace}>
        Consultar órdenes <ArrowRightIcon className="size-4" aria-hidden="true" />
      </Link>
    </header>

    <div className="grid gap-3 sm:grid-cols-3">
      <Indicador titulo="Órdenes registradas" valor={datos.totalOrdenes} icono={ClipboardListIcon} />
      <Indicador titulo="Pendientes de asignación" valor={datos.sinTecnico} icono={UserRoundPlusIcon} alerta={datos.sinTecnico > 0} />
      <Indicador titulo="Listas para entregar" valor={datos.listas} icono={PackageCheckIcon} />
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader>
          <h3 className="font-semibold">Órdenes por estado</h3>
          <p className="text-sm text-muted-foreground">Estado actual de las órdenes registradas</p>
        </CardHeader>
        <CardContent><GraficoResumen valores={datos.porEstado} vacio="Todavía no hay órdenes registradas." /></CardContent>
      </Card>
      <Card className="min-w-0">
        <CardHeader>
          <h3 className="font-semibold">Órdenes recibidas y entregadas</h3>
          <p className="text-sm text-muted-foreground">Últimos 7 días · Hora de Bolivia</p>
        </CardHeader>
        <CardContent><GraficoActividad dias={datos.dias} /></CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <h3 id="carga-tecnica" className="font-semibold">Carga por técnico</h3>
        <p className="text-sm text-muted-foreground">Las órdenes sin cierre técnico ocupan cupo.</p>
      </CardHeader>
      <CardContent>
        {datos.tecnicos.length === 0 ? <p className="text-sm text-muted-foreground">No hay técnicos activos.</p> :
          <Table aria-labelledby="carga-tecnica">
            <TableHeader>
              <TableRow>
                <TableHead scope="col">Técnico</TableHead>
                <TableHead scope="col" className="text-right">Cupos ocupados</TableHead>
                <TableHead scope="col" className="text-right">Cupos disponibles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {datos.tecnicos.map(({ id, etiqueta, ordenesActivas }) => {
                const libres = Math.max(0, cuposTecnico - ordenesActivas);
                return <TableRow key={id}>
                  <TableHead scope="row" className="whitespace-normal">{etiqueta}</TableHead>
                  <TableCell className="text-right tabular-nums">{ordenesActivas} de {cuposTecnico}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {libres > 0 ? libres : <span className="font-medium text-amber-700 dark:text-amber-300">Cupo completo</span>}
                  </TableCell>
                </TableRow>;
              })}
            </TableBody>
          </Table>}
      </CardContent>
    </Card>
  </>;
}

export async function DashboardRol({ rol, id }: { rol: RolUsuario; id: number }) {
  try {
    if (rol === "ADMINISTRADOR") return await Administracion();
    if (rol === "RECEPCIONISTA") return await Recepcion();
    if (rol === "GERENTE") return await Gerencia();
    return await Tecnico({ id });
  } catch (error) {
    console.error("Error al consultar el dashboard:", error);
    return <p role="alert" className="rounded-lg border p-4">No se pudieron cargar los indicadores. Vuelve a cargar la página para reintentar.</p>;
  }
}
