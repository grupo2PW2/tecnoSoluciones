
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { DetalleTecnicoOrden } from "@/features/ordenes/components/detalle-tecnico-orden";
import { ConsumoRepuestosOrden } from "@/features/ordenes/components/consumo-repuestos-orden";
import { puedeEjecutarReparacion } from "@/features/ordenes/ejecucion-modelo";
import { EjecucionOrden } from "@/features/ordenes/components/ejecucion-orden";
import { listarTrabajoAutorizado } from "@/features/ordenes/ejecucion";
import { obtenerDetalleTecnico } from "@/features/ordenes/detalle-tecnico";
import { puedeConsultarOrdenes, puedeRegistrarIngreso, puedeTomarOrdenes } from "@/features/ordenes/modelo";
import { PresupuestoOrden } from "@/features/presupuestos/components/presupuesto-orden";
import { DetalleRecepcionOrden } from "@/features/presupuestos/components/detalle-recepcion-orden";
import { idSchema } from "@/features/ordenes/schemas";
import { getCurrentUser } from "@/lib/auth";

interface Props {
  params: Promise<{ id: string }>;
}

async function DetalleAutorizado({ params }: Props) {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/login");
  if (!puedeTomarOrdenes(usuario.rol) && !puedeConsultarOrdenes(usuario.rol)) notFound();

  const { id } = await params;
  const resultado = idSchema.safeParse(Number(id));
  if (!resultado.success) notFound();

  await connection();
  if (puedeConsultarOrdenes(usuario.rol)) return <DetalleRecepcionOrden ordenId={resultado.data}
    puedeAtender={puedeRegistrarIngreso(usuario.rol)} />;

  const orden = await obtenerDetalleTecnico(resultado.data, usuario.id);
  if (!orden) notFound();

  const trabajos = ["APROBADO", "EN_REPARACION", "LISTO", "ENTREGADO"].includes(orden.estado)
    ? await listarTrabajoAutorizado(orden.id)
    : null;

  const puedeCotizar = orden.tipoIngreso === "DIAGNOSTICO" && !orden.fechaCierreTecnico &&
    orden.diagnostico?.estado === "FINALIZADO" && orden.diagnostico.trabajoVerificado;

  return <DetalleTecnicoOrden orden={orden}>
    <ConsumoRepuestosOrden ordenId={orden.id}
      puedeRegistrar={puedeEjecutarReparacion(orden.estado, orden.fechaCierreTecnico !== null)} />
    {trabajos && <EjecucionOrden ordenId={orden.id} estado={orden.estado}
      cerrado={orden.fechaCierreTecnico !== null} trabajos={trabajos} />}
    <PresupuestoOrden ordenId={orden.id} ordenPendiente={orden.estado === "PENDIENTE_APROBACION"}
      puedeEditar={puedeCotizar && (orden.estado === "EN_DIAGNOSTICO" || orden.estado === "PENDIENTE_APROBACION")}
      servicioDirecto={orden.tipoIngreso === "SERVICIO_DIRECTO"}
      puedeVersionar={puedeCotizar} puedeRetirar={orden.fechaCierreTecnico === null} />
  </DetalleTecnicoOrden>;
}

export default function OrdenDetallePage({ params }: Props) {
  return (
    <Suspense fallback={<p role="status" className="p-6">Cargando la orden…</p>}>
      <DetalleAutorizado params={params} />
    </Suspense>
  );
}
