import {
  CircleCheckIcon, CircleXIcon, ClockIcon, ClipboardCheckIcon, ClipboardListIcon, PackageCheckIcon,
  SearchIcon, Undo2Icon, WrenchIcon, type LucideIcon,
} from "lucide-react";
import type { EstadoOrden } from "../modelo";

type EstadoVisible = EstadoOrden | "OFERTA_VENCIDA" | "OFERTA_RETIRADA" | "OFERTA_PREPARANDO" | "CONFIRMACION_TIENDA";
type Tono = "azul" | "violeta" | "ambar" | "verde" | "rojo" | "neutro";
const tonos: Record<Tono, string> = {
  azul: "border-sky-500/35 bg-sky-500/10 text-sky-900 dark:text-sky-200",
  violeta: "border-violet-500/35 bg-violet-500/10 text-violet-900 dark:text-violet-200",
  ambar: "border-amber-500/35 bg-amber-500/10 text-amber-900 dark:text-amber-200",
  verde: "border-emerald-500/35 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200",
  rojo: "border-rose-500/35 bg-rose-500/10 text-rose-900 dark:text-rose-200",
  neutro: "border-border bg-muted text-foreground",
};

const estados: Record<EstadoVisible, { titulo: string; detalle: string; icono: LucideIcon; tono: Tono }> = {
  RECIBIDO: { titulo: "Equipo recibido", detalle: "Registramos tu equipo. Aquí podrás revisar el avance de la orden.", icono: ClipboardListIcon, tono: "azul" },
  EN_DIAGNOSTICO: { titulo: "En diagnóstico", detalle: "Estamos revisando tu equipo para identificar qué trabajo necesita.", icono: SearchIcon, tono: "violeta" },
  PENDIENTE_APROBACION: { titulo: "Presupuesto por responder", detalle: "Revisa el alcance, el importe y las fechas antes de aprobar o rechazar.", icono: ClipboardCheckIcon, tono: "ambar" },
  APROBADO: { titulo: "Presupuesto aprobado", detalle: "El trabajo está autorizado. Puedes consultar aquí cuándo empieza la reparación.", icono: CircleCheckIcon, tono: "verde" },
  RECHAZADO: { titulo: "Presupuesto rechazado", detalle: "Comunícate con recepción para coordinar la devolución de tu equipo.", icono: CircleXIcon, tono: "rojo" },
  RECHAZADO_ENTREGADO: { titulo: "Equipo devuelto", detalle: "La devolución quedó registrada.", icono: Undo2Icon, tono: "neutro" },
  EN_REPARACION: { titulo: "En reparación", detalle: "Estamos realizando el trabajo autorizado.", icono: WrenchIcon, tono: "violeta" },
  LISTO: { titulo: "Listo para recoger", detalle: "Tu equipo está listo para la entrega. Ten a mano el ticket de ingreso.", icono: PackageCheckIcon, tono: "verde" },
  ENTREGADO: { titulo: "Equipo entregado", detalle: "La entrega quedó registrada.", icono: PackageCheckIcon, tono: "neutro" },
  CANCELADO: { titulo: "Orden cancelada", detalle: "Si el equipo sigue en tienda, comunícate con recepción para coordinar su devolución.", icono: CircleXIcon, tono: "rojo" },
  OFERTA_VENCIDA: { titulo: "Oferta vencida", detalle: "El plazo para responder terminó. Consulta con recepción para conocer el siguiente paso.", icono: ClockIcon, tono: "ambar" },
  OFERTA_RETIRADA: { titulo: "Oferta retirada", detalle: "Podrás revisar la nueva versión cuando esté disponible.", icono: Undo2Icon, tono: "ambar" },
  OFERTA_PREPARANDO: { titulo: "Nueva oferta en preparación", detalle: "Estamos preparando otra versión del presupuesto.", icono: ClipboardListIcon, tono: "azul" },
  CONFIRMACION_TIENDA: { titulo: "Confirmación en tienda", detalle: "Recepción coordinará contigo la confirmación del presupuesto.", icono: ClipboardCheckIcon, tono: "ambar" },
};

export function EstadoSeguimiento({ estado, detalle }: { estado: EstadoVisible; detalle?: string }) {
  const { titulo, detalle: mensaje, icono: Icono, tono } = estados[estado];
  return <section aria-labelledby="estado-actual" className={"flex items-start gap-3 rounded-lg border p-4 sm:gap-4 sm:p-5 " + tonos[tono]}>
    <Icono className="mt-1 size-5 shrink-0" aria-hidden="true" />
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-semibold">Estado actual</p>
      <h2 id="estado-actual" className="text-xl font-bold tracking-tight">{titulo}</h2>
      <p className="text-sm">{detalle ?? mensaje}</p>
    </div>
  </section>;
}
