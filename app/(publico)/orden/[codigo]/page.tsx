import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { connection } from "next/server";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ProgresoSeguimiento } from "@/features/ordenes/components/progreso-seguimiento";
import { EstadoSeguimiento } from "@/features/ordenes/components/estado-seguimiento";
import { fechaIngreso, textoEquipo } from "@/features/ordenes/modelo";
import { obtenerSeguimiento } from "@/features/ordenes/queries";
import { obtenerPresupuestoOrden } from "@/features/presupuestos/consultas";
import { ResumenPresupuesto } from "@/features/presupuestos/components/resumen-presupuesto";
import { RespuestaOferta } from "@/features/presupuestos/components/respuesta-oferta";

export const metadata: Metadata = {
  title: "Seguimiento de orden",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

interface Props {
  params: Promise<{ codigo: string }>;
}

async function Seguimiento({ params }: Props) {
  const { codigo } = await params;
  await connection();

  const ahora = new Date();
  const datos = await (async () => {
    const orden = await obtenerSeguimiento(codigo);
    if (!orden) return null;
    const oferta = await obtenerPresupuestoOrden(orden.id, ahora);
    return { orden, oferta };
  })().catch((error: unknown) => {
    console.error("Error al mostrar el seguimiento de una orden:", error);
    return undefined;
  });

  if (datos === undefined) return <p role="alert">No pudimos consultar la orden. Inténtalo nuevamente.</p>;
  if (!datos) return <p role="alert">No encontramos una orden con ese código. Verifica el código impreso en tu ticket.</p>;
  const { orden, oferta } = datos;

  const servicioDirecto = orden.tipoIngreso === "SERVICIO_DIRECTO";
  const pendiente = orden.estado === "PENDIENTE_APROBACION";
  const disponible = !servicioDirecto && pendiente && oferta?.estado === "PENDIENTE_APROBACION" && Boolean(oferta.fechaPresentacion) &&
    oferta.venceEn !== null && new Date(oferta.venceEn) > ahora && oferta.total !== null;
  const vencida = pendiente && oferta?.estado === "VENCIDO";
  const retirada = pendiente && oferta?.estado === "CANCELADO" && Boolean(oferta.fechaPresentacion);

  const estado = vencida ? "OFERTA_VENCIDA" : retirada ? "OFERTA_RETIRADA"
    : pendiente && servicioDirecto ? "CONFIRMACION_TIENDA"
    : pendiente && !disponible ? "OFERTA_PREPARANDO" : orden.estado;
  const detalle = retirada && servicioDirecto ? "Recepción confirma la nueva cotización contigo en tienda."
    : orden.estado === "CANCELADO" && orden.fechaEntregaCliente ? "La devolución del equipo quedó registrada." : undefined;

  return <div className="space-y-5">
    <EstadoSeguimiento estado={estado} detalle={detalle} />
    <ProgresoSeguimiento estado={orden.estado} servicioDirecto={servicioDirecto} devuelta={Boolean(orden.fechaEntregaCliente)} />
    <dl className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
      {orden.dispositivo && <div>
        <dt className="text-sm text-muted-foreground">Equipo</dt>
        <dd className="font-semibold wrap-break-word">{textoEquipo(orden.dispositivo)}</dd>
      </div>}
      <div>
        <dt className="text-sm text-muted-foreground">Fecha de ingreso</dt>
        <dd className="font-medium">{fechaIngreso(orden.fechaIngreso)}</dd>
      </div>
      {orden.fechaEntregaCliente && <div>
        <dt className="text-sm text-muted-foreground">{orden.estado === "ENTREGADO" ? "Fecha de entrega" : "Fecha de devolución"}</dt>
        <dd className="font-medium">{fechaIngreso(orden.fechaEntregaCliente)}</dd>
      </div>}
    </dl>
    {disponible && <>
      <ResumenPresupuesto presupuesto={oferta} />
      <RespuestaOferta key={oferta.id} presupuesto={oferta} origen={{ canal: "WEB", codigoCliente: codigo }} />
    </>}
    {servicioDirecto && oferta?.estado === "APROBADO" && orden.estado !== "CANCELADO" &&
      <ResumenPresupuesto presupuesto={oferta} servicioDirecto />}
    {(oferta?.estado === "APROBADO" || oferta?.estado === "RECHAZADO") && oferta.fechaRespuesta &&
      <p className="text-sm text-muted-foreground">{servicioDirecto && oferta.estado === "APROBADO" && oferta.canalRespuesta === "EN_TIENDA"
        ? "Aceptado en tienda el " : "Respuesta registrada el "}{fechaIngreso(oferta.fechaRespuesta)}.</p>}
  </div>;
}

export default function SeguimientoPage({ params }: Props) {
  return <div className="mx-auto max-w-3xl space-y-4 px-4 py-8 sm:py-12">
    <Link href="/" className="inline-flex items-center gap-2 rounded-sm text-sm font-medium text-primary underline-offset-4 hover:underline">
      <ArrowLeftIcon className="size-4" aria-hidden="true" /> Consultar otro código
    </Link>
    <Card>
      <CardHeader><h1 className="text-2xl font-bold tracking-tight">Seguimiento de orden</h1></CardHeader>
      <CardContent>
        <Suspense fallback={<p role="status">Consultando orden…</p>}><Seguimiento params={params} /></Suspense>
      </CardContent>
    </Card>
  </div>;
}
