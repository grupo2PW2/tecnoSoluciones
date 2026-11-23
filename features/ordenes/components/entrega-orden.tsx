
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mostrarBs } from "@/features/presupuestos/importes";
import { calcularCobroEntrega } from "../entrega";
import { fechaIngreso, textoCliente } from "../modelo";
import { ConfirmacionEntrega } from "./confirmacion-entrega";

export async function EntregaOrden({ orden, puedeRegistrar }: {
  orden: Parameters<typeof calcularCobroEntrega>[0] & {
    codigo: string;
    entregadoPor: { nombre: string; apellido: string } | null;
  };
  puedeRegistrar: boolean;
}) {
  if (orden.fechaEntregaCliente) {
    const devolucion = orden.estado === "CANCELADO" || orden.estado === "RECHAZADO_ENTREGADO";
    return (
      <Card>
        <CardHeader><CardTitle>{devolucion ? "Devolución registrada" : "Entrega registrada"}</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div><dt className="font-semibold">Fecha</dt><dd>{fechaIngreso(orden.fechaEntregaCliente)}</dd></div>
            <div><dt className="font-semibold">Registrada por</dt><dd>{orden.entregadoPor ? textoCliente(orden.entregadoPor) : "Sin registrar"}</dd></div>
            <div><dt className="font-semibold">Importe cobrado</dt><dd>{orden.montoCobrado !== null ? mostrarBs(orden.montoCobrado) : "Sin cobro"}</dd></div>
          </dl>
        </CardContent>
      </Card>
    );
  }

  if (!puedeRegistrar && !["LISTO", "RECHAZADO", "CANCELADO"].includes(orden.estado)) return null;
  const cobro = await calcularCobroEntrega(orden);
  if ("error" in cobro) return (
    <Card>
      <CardHeader><CardTitle>Entrega del equipo</CardTitle></CardHeader>
      <CardContent><p className="text-sm text-muted-foreground">{cobro.error}</p></CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader><CardTitle>{cobro.operacion === "devolucion" ? "Devolución del equipo" : "Entrega del equipo"}</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <dl className="grid max-w-md gap-2 rounded-lg border bg-muted/30 p-4 text-sm">
          {cobro.partidas.map((partida) => <div key={partida.concepto} className="flex justify-between gap-4">
            <dt>{partida.concepto}</dt><dd>{mostrarBs(partida.importe)}</dd>
          </div>)}
          <div className={"flex justify-between gap-4 font-semibold " + (cobro.partidas.length ? "border-t pt-2" : "")}>
            <dt>Total a cobrar</dt><dd>{cobro.monto === null ? "Sin cobro" : mostrarBs(cobro.monto)}</dd>
          </div>
        </dl>
        {puedeRegistrar && <ConfirmacionEntrega ordenId={orden.id} codigo={orden.codigo}
          operacion={cobro.operacion} monto={cobro.monto} />}
      </CardContent>
    </Card>
  );
}
