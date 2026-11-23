
import { estadosOrden, type EstadoOrden } from "../modelo";

const colorEstado: Record<EstadoOrden, string> = {
  RECIBIDO: "bg-sky-500/15 text-sky-800 dark:text-sky-200",
  EN_DIAGNOSTICO: "bg-violet-500/15 text-violet-800 dark:text-violet-200",
  PENDIENTE_APROBACION: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  APROBADO: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  RECHAZADO: "bg-red-500/15 text-red-800 dark:text-red-200",
  RECHAZADO_ENTREGADO: "bg-red-500/15 text-red-800 dark:text-red-200",
  EN_REPARACION: "bg-violet-500/15 text-violet-800 dark:text-violet-200",
  LISTO: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  ENTREGADO: "bg-muted text-foreground",
  CANCELADO: "bg-muted text-foreground",
};

export function EstadoOrdenEtiqueta({ estado }: { estado: EstadoOrden }) {
  return (
    <span className={"inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " + colorEstado[estado]}>
      {estadosOrden[estado]}
    </span>
  );
}
