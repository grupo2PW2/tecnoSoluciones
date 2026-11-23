import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mostrarExistencias } from "@/lib/existencias";
import { consultarConsumoRepuestos } from "../consumo-repuestos";
import { fechaIngreso, textoCliente } from "../modelo";
import { RegistroConsumoRepuestos } from "./registro-consumo-repuestos";

export async function ConsumoRepuestosOrden({ ordenId, puedeRegistrar = false }: {
  ordenId: number;
  puedeRegistrar?: boolean;
}) {
  const { repuestos, salidas } = await consultarConsumoRepuestos(ordenId);
  if (!repuestos.length && !salidas.length) return null;

  return (
    <Card>
      <CardHeader><CardTitle>Repuestos utilizados</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        {repuestos.length > 0 && <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repuesto</TableHead>
                <TableHead className="text-right">Unidades aprobadas</TableHead>
                <TableHead className="text-right">Unidades utilizadas</TableHead>
                {puedeRegistrar && <TableHead className="text-right">Stock</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {repuestos.map((repuesto) => (
                <TableRow key={repuesto.id}>
                  <TableCell className="whitespace-normal">
                    <p className="font-medium">{repuesto.nombre}</p>
                    {repuesto.sku && <p className="text-xs text-muted-foreground">{repuesto.sku}</p>}
                  </TableCell>
                  <TableCell className="text-right">{repuesto.autorizadas}</TableCell>
                  <TableCell className="text-right">{repuesto.utilizadas}</TableCell>
                  {puedeRegistrar && <TableCell className="text-right">{mostrarExistencias(repuesto)}</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>}
        {puedeRegistrar && repuestos.length > 0 && <RegistroConsumoRepuestos ordenId={ordenId} repuestos={repuestos} />}
        {salidas.length > 0 ? <details className="rounded-lg border p-3 text-sm">
          <summary className="cursor-pointer font-semibold">Historial de salidas</summary>
          <ul className="mt-3 space-y-2">
            {salidas.map((salida) => <li key={salida.id} className="rounded-lg border p-3">
              <p className="font-medium">Salida #{salida.id} · {fechaIngreso(salida.fecha)}</p>
              {salida.registradoPor && <p className="text-muted-foreground">Registrada por {textoCliente(salida.registradoPor)}</p>}
              <ul className="mt-2 list-disc pl-5">
                {salida.detalleMovimientos.map((detalle) => <li key={detalle.id}>
                  {detalle.repuesto?.nombre ?? "Repuesto"} · {detalle.cantidad} {detalle.cantidad === 1 ? "unidad" : "unidades"}
                </li>)}
              </ul>
            </li>)}
          </ul>
        </details> : <p className="text-sm text-muted-foreground">Todavía no se registraron salidas para esta orden.</p>}
      </CardContent>
    </Card>
  );
}
