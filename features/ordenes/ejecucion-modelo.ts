
import type { EstadoOrden } from "./modelo";

export interface TrabajoAutorizado {
  presupuestoId: number;
  servicioId: number;
  version: number | null;
  nombre: string;
  cantidad: number;
  estado: "PRESUPUESTADO" | "PENDIENTE_EJECUCION" | "EN_PROCESO" | "FINALIZADO" | "CANCELADO";
  fechaInicio: string | null;
  fechaFinalizacion: string | null;
  observaciones: string | null;
  trabajoVerificado: boolean;
  esDiagnostico: boolean;
}

export function puedeEjecutarReparacion(estado: EstadoOrden, cerrado: boolean) {
  return !cerrado && (estado === "APROBADO" || estado === "EN_REPARACION");
}

export function trabajoCompleto(trabajo: Pick<TrabajoAutorizado, "estado" | "trabajoVerificado">) {
  return trabajo.estado === "FINALIZADO" && trabajo.trabajoVerificado;
}

export function trabajoPuedeIniciar(trabajo: Pick<TrabajoAutorizado, "estado" | "esDiagnostico">) {
  return !trabajo.esDiagnostico &&
    (trabajo.estado === "PENDIENTE_EJECUCION" || trabajo.estado === "PRESUPUESTADO");
}
