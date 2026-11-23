
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EstadoOrdenEtiqueta } from "@/features/ordenes/components/estado-orden-etiqueta";
import { EntregaOrden } from "@/features/ordenes/components/entrega-orden";
import { DialogoAsignacion } from "@/features/ordenes/components/dialogo-asignacion";
import { ConsumoRepuestosOrden } from "@/features/ordenes/components/consumo-repuestos-orden";
import { CancelacionOrden } from "@/features/ordenes/components/cancelacion-orden";
import { estadosAsignables, textoCliente, textoEquipo, tiposIngreso } from "@/features/ordenes/modelo";
import { obtenerOrdenParaConsulta } from "../consultas";
import { PresupuestoOrden } from "./presupuesto-orden";

export async function DetalleRecepcionOrden({ ordenId, puedeAtender }: { ordenId: number; puedeAtender: boolean }) {
  const orden = await obtenerOrdenParaConsulta(ordenId);
  if (!orden) notFound();
  const servicioDirecto = orden.tipoIngreso === "SERVICIO_DIRECTO";
  const ordenPendiente = orden.estado === "PENDIENTE_APROBACION";
  const puedeCotizarDirecto = puedeAtender && servicioDirecto && !orden.fechaCierreTecnico;
  const recibido = orden.estado === "RECIBIDO";
  const puedeAsignar = puedeCotizarDirecto && orden.tecnicoId === null && estadosAsignables.includes(orden.estado);

  return (
    <section className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-8">
      <Button variant="ghost" render={<Link href="/ordenes" />} nativeButton={false}>Volver a Órdenes</Button>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Orden {orden.codigo}</p>
          <h1 className="mt-1 text-2xl font-semibold">{orden.dispositivo ? textoEquipo(orden.dispositivo) : "Equipo no disponible"}</h1>
          {orden.tipoIngreso && <p className="mt-1 text-sm text-muted-foreground">{tiposIngreso[orden.tipoIngreso]}</p>}
        </div>
        <EstadoOrdenEtiqueta estado={orden.estado} />
      </header>
      {servicioDirecto && <div className="flex flex-wrap items-end justify-between gap-3 rounded-lg border p-4">
        <dl className="grid gap-2 text-sm">
          <div><dt className="font-semibold">Motivo del ingreso</dt><dd>{orden.problemasReportados}</dd></div>
          <div><dt className="font-semibold">Técnico</dt><dd>{orden.tecnicoResponsable ? textoCliente(orden.tecnicoResponsable) : "Sin asignar"}</dd></div>
        </dl>
        {puedeAsignar && <DialogoAsignacion ordenId={ordenId} codigo={orden.codigo} actualizarDetalle />}
      </div>}
      <CancelacionOrden orden={orden} puedeCancelar={puedeAtender} />
      <EntregaOrden orden={orden} puedeRegistrar={puedeAtender} />
      <ConsumoRepuestosOrden ordenId={ordenId} />
      <PresupuestoOrden ordenId={ordenId} ordenPendiente={ordenPendiente} servicioDirecto={servicioDirecto}
        puedeIniciar={puedeCotizarDirecto && recibido} puedeEditar={puedeCotizarDirecto && (recibido || ordenPendiente)}
        puedeVersionar={puedeCotizarDirecto && ordenPendiente}
        puedeResponderEnTienda={puedeAtender} puedeRetirar={puedeAtender} mostrarVacio />
    </section>
  );
}
