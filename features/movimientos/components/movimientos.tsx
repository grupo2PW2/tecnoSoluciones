import Link from "next/link";
import { ArrowUpRightIcon, ChevronDownIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RepuestoInventario } from "@/features/inventario/modelo";
import { calcularTotalVenta, mostrarImporteExacto } from "@/features/inventario/precios";
import { fechaIngreso } from "@/features/ordenes/modelo";
import { mostrarUnidades } from "@/lib/existencias";
import type { MovimientoInventario, TipoMovimiento } from "../modelo";
import { RegistrarMovimiento } from "./registrar-movimiento";

const tipos: Record<TipoMovimiento, { etiqueta: string; clase: string }> = {
  ENTRADA: { etiqueta: "Entrada", clase: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200" },
  SALIDA: { etiqueta: "Salida manual", clase: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200" },
  SALIDA_VENTA: { etiqueta: "Venta directa", clase: "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200" },
  SALIDA_REPARACION: { etiqueta: "Salida por reparación", clase: "border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200" },
};

export function Movimientos({ repuestos, movimientos, margenGanancia }: {
  repuestos: RepuestoInventario[]; movimientos: MovimientoInventario[]; margenGanancia: string;
}) {
  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Movimientos</h1>
        <Link href="/inventario#existencias" className={buttonVariants({ variant: "outline" })}>
          Ver existencias <ArrowUpRightIcon aria-hidden="true" />
        </Link>
      </header>

      <section aria-label="Registrar movimientos" className="flex flex-wrap items-start gap-x-3 gap-y-4 rounded-xl border bg-card p-4">
        <RegistrarMovimiento tipo="ENTRADA" catalogo={repuestos} margenGanancia={margenGanancia} />
        <RegistrarMovimiento tipo="SALIDA" catalogo={repuestos} margenGanancia={margenGanancia} />
        <RegistrarMovimiento tipo="SALIDA_VENTA" catalogo={repuestos} margenGanancia={margenGanancia} />
      </section>

      <Card id="historial" className="scroll-mt-6">
        <CardHeader><h2 className="text-base font-semibold">Movimientos recientes</h2></CardHeader>
        <CardContent className="space-y-3">
          {movimientos.length === 0
            ? <p className="text-sm text-muted-foreground">Todavía no hay movimientos registrados.</p>
            : movimientos.map((movimiento) => <FichaMovimiento key={movimiento.id} movimiento={movimiento} />)}
        </CardContent>
      </Card>
    </section>
  );
}

const formatoMargen = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });

function FichaMovimiento({ movimiento }: { movimiento: MovimientoInventario }) {
  const { id, tipo, orden, fecha, responsable, referencia, partidas } = movimiento;
  const estilo = tipos[tipo];
  const esEntrada = tipo === "ENTRADA";
  const esVenta = tipo === "SALIDA_VENTA";
  const esReparacion = tipo === "SALIDA_REPARACION";
  const muestraMargen = esVenta || esReparacion;
  const unidades = partidas.reduce((total, partida) => total + partida.cantidad, 0);
  const importe = esEntrada
    ? calcularTotalVenta(partidas.map(({ costoTotal }) => ({ cantidad: 1, precioUnitario: costoTotal })))
    : esVenta ? calcularTotalVenta(partidas) : null;

  return (
    <details className="group rounded-lg border">
      <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-x-5 gap-y-3 rounded-lg p-4 text-sm focus-visible:outline-2 focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
        <span className="block min-w-0 space-y-1.5">
          <span className="flex flex-wrap items-center gap-2">
            <span className={"rounded-full border px-2.5 py-0.5 text-xs font-semibold " + estilo.clase}>{estilo.etiqueta}</span>
            <span className="font-semibold tabular-nums">#{id}</span>
            {orden && <span className="break-words text-muted-foreground">Orden {orden.codigo}</span>}
          </span>
          <span className="block text-xs text-muted-foreground">
            {fechaIngreso(fecha)}{responsable && " · " + responsable}
          </span>
        </span>
        <span className="flex items-center gap-4">
          <span className="block space-y-1 sm:text-right">
            {partidas.length > 0
              ? <span className="block font-semibold tabular-nums">{esEntrada ? "+" : "−"}{mostrarUnidades(unidades)}</span>
              : <span className="block text-muted-foreground">Sin partidas</span>}
            {partidas.length > 0 && importe !== null && <span className="block text-xs text-muted-foreground">
              {esVenta ? "Cobrado" : "Costo del lote"} <strong className="text-foreground">{mostrarImporteExacto(importe)}</strong>
            </span>}
          </span>
          <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </span>
      </summary>

      <div className="space-y-3 border-t p-4 text-sm">
        {orden && <Link href={"/ordenes/" + orden.id} className={buttonVariants({ variant: "outline", size: "sm" })}>
          Ver orden {orden.codigo} <ArrowUpRightIcon aria-hidden="true" />
        </Link>}
        {referencia && <p className="whitespace-pre-wrap break-words">{referencia}</p>}
        {partidas.length > 0 && <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repuesto</TableHead>
                <TableHead className="text-right">{esEntrada ? "Cantidad ingresada" : "Cantidad retirada"}</TableHead>
                <TableHead className="text-right">Costo unitario</TableHead>
                {muestraMargen && <TableHead className="text-right">{esReparacion ? "Precio unitario aprobado" : "Precio unitario"}</TableHead>}
                {muestraMargen && <TableHead className="text-right">Margen sobre costo</TableHead>}
                {esVenta && <TableHead className="text-right">Subtotal</TableHead>}
                {esEntrada && <TableHead className="text-right">Costo total del lote</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {partidas.map((partida) => {
                const subtotal = esVenta ? calcularTotalVenta([partida]) : partida.costoTotal;
                return <TableRow key={partida.id}>
                  <TableCell className="whitespace-normal">
                    <p className="font-medium">{partida.nombre}</p>
                    {partida.sku && <p className="text-xs text-muted-foreground">{partida.sku}</p>}
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{mostrarUnidades(partida.cantidad)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {mostrarImporteExacto(partida.costoUnitario)}
                  </TableCell>
                  {muestraMargen && <TableCell className="text-right tabular-nums">
                    {partida.precioUnitario === null ? "Sin registrar" : mostrarImporteExacto(partida.precioUnitario)}
                  </TableCell>}
                  {muestraMargen && <TableCell className="text-right font-semibold tabular-nums">
                    {partida.margenAplicado === null
                      ? <span className="font-normal text-muted-foreground">Sin registrar</span>
                      : formatoMargen.format(Number(partida.margenAplicado)) + " %"}
                  </TableCell>}
                  {(esVenta || esEntrada) && <TableCell className="text-right font-semibold tabular-nums">
                    {subtotal === null ? "Sin registrar" : mostrarImporteExacto(subtotal)}
                  </TableCell>}
                </TableRow>;
              })}
            </TableBody>
          </Table>
        </div>}
      </div>
    </details>
  );
}
