
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mostrarDia } from "../fechas";
import { fechaIngreso } from "@/features/ordenes/modelo";
import { canalesRespuesta } from "../respuesta-modelo";
import { calcularPresupuesto, importePartida, mostrarBs } from "../importes";
import { estadosPresupuesto, type DetallePresupuesto } from "../modelo";

const prioridades = { BAJA: "Baja", MEDIA: "Media", ALTA: "Alta" } as const;

export function ResumenPresupuesto({ presupuesto, mostrarCanal, retirada, servicioDirecto }: {
  presupuesto: DetallePresupuesto; mostrarCanal?: boolean; retirada?: boolean; servicioDirecto?: boolean;
}) {
  const subtotales = calcularPresupuesto(presupuesto.servicios, presupuesto.repuestos,
    presupuesto.diagnostico?.precioUnitario ?? "0.00", presupuesto.prioridad);
  const titulo = servicioDirecto ? "Presupuesto de servicio directo" : "Presupuesto de reparación";
  const diagnostico = presupuesto.diagnostico ? [{ ...presupuesto.diagnostico, categoria: "Diagnóstico" }] : [];
  const lineas = [
    ...diagnostico,
    ...presupuesto.servicios.map((partida) => ({ ...partida, categoria: "Servicio" })),
    ...presupuesto.repuestos.map((partida) => ({ ...partida, categoria: "Repuesto" })),
  ];

  return (
    <section className="space-y-4" aria-label={titulo}>
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{titulo} · Versión {presupuesto.version}</h2>
        <p className="rounded-full border px-2 py-1 text-xs font-semibold">
          {retirada ? "Retirada" : estadosPresupuesto[presupuesto.estado]}
        </p>
      </header>

      <dl className="grid gap-3 text-sm sm:grid-cols-3">
        {presupuesto.fechaPresentacion && <div><dt className="text-muted-foreground">Presentado el</dt><dd>{mostrarDia(presupuesto.fechaPresentacion)}</dd></div>}
        <div><dt className="text-muted-foreground">Prioridad</dt><dd>{prioridades[presupuesto.prioridad]}</dd></div>
        {presupuesto.fechaEstimada && <div><dt className="text-muted-foreground">Entrega estimada</dt><dd>{mostrarDia(presupuesto.fechaEstimada)}</dd></div>}
        {presupuesto.fechaVencimiento && <div><dt className="text-muted-foreground">Válido hasta</dt><dd>{mostrarDia(presupuesto.fechaVencimiento)}</dd></div>}
      </dl>

      {mostrarCanal && presupuesto.fechaRespuesta && <p className="text-sm text-muted-foreground">
        Respuesta registrada el {fechaIngreso(presupuesto.fechaRespuesta)}
        {presupuesto.canalRespuesta && " · " + canalesRespuesta[presupuesto.canalRespuesta]}
      </p>}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partida</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Precio unitario</TableHead>
              <TableHead className="text-right">Importe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineas.map((partida) => (
              <TableRow key={partida.categoria + partida.id}>
                <TableCell className="whitespace-normal break-words">
                  <p className="font-medium">{partida.nombre}</p>
                  <p className="text-xs text-muted-foreground">{partida.categoria}</p>
                </TableCell>
                <TableCell className="text-right">{partida.cantidad}</TableCell>
                <TableCell className="text-right">{mostrarBs(partida.precioUnitario)}</TableCell>
                <TableCell className="text-right">{mostrarBs(importePartida(partida))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {presupuesto.total && <dl className="ml-auto grid max-w-sm gap-2 rounded-lg border bg-muted/30 p-4 text-sm">
        {presupuesto.repuestos.length > 0 && <>
          <div className="flex justify-between gap-3"><dt>Subtotal de servicios</dt><dd>{mostrarBs(subtotales.subtotalServicios)}</dd></div>
          <div className="flex justify-between gap-3"><dt>Subtotal de repuestos</dt><dd>{mostrarBs(subtotales.subtotalRepuestos)}</dd></div>
        </>}
        <div className="flex justify-between gap-3"><dt>Recargo ({Number(presupuesto.porcentajeRecargo)} %)</dt><dd>{mostrarBs(presupuesto.montoRecargo)}</dd></div>
        {presupuesto.diagnostico && <div className="flex justify-between gap-3"><dt>Descuento del diagnóstico</dt><dd>−{mostrarBs(presupuesto.descuentoDiagnostico)}</dd></div>}
        <div className="flex justify-between gap-3 border-t pt-2 text-base font-semibold"><dt>Total ofrecido</dt><dd>{mostrarBs(presupuesto.total)}</dd></div>
      </dl>}

      {presupuesto.observaciones && <div className="text-sm">
        <p className="font-semibold">Notas para el cliente</p>
        <p className="whitespace-pre-wrap break-words">{presupuesto.observaciones}</p>
      </div>}
    </section>
  );
}
