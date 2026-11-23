
import type { PartidaValorizada, PrioridadPresupuesto } from "./importes";
import type { CanalRespuesta } from "./respuesta-modelo";

export interface PartidaPresupuesto extends PartidaValorizada {
  id: number;
  nombre: string;
}

export interface DetallePresupuesto {
  id: number;
  version: number;
  estado: "BORRADOR" | "PENDIENTE_APROBACION" | "APROBADO" | "RECHAZADO" | "VENCIDO" | "CANCELADO";
  prioridad: PrioridadPresupuesto;
  fechaEstimada: string | null;
  fechaVencimiento: string | null;
  fechaPresentacion: string | null;
  venceEn: string | null;
  fechaRespuesta: string | null;
  canalRespuesta: CanalRespuesta | null;
  observaciones: string;
  diagnostico: PartidaPresupuesto | null;
  servicios: PartidaPresupuesto[];
  repuestos: PartidaPresupuesto[];
  porcentajeRecargo: string;
  montoRecargo: string;
  descuentoDiagnostico: string;
  total: string | null;
}

export interface OpcionServicio {
  id: number;
  nombre: string;
  precioUnitario: string;
}


export interface OpcionRepuesto {
  id: number;
  nombre: string;
  sku: string;
  precioUnitario: string;
  stock: number;
  unidadesCaja: number;
  disponible: boolean;
}

export const estadosPresupuesto: Record<DetallePresupuesto["estado"], string> = {
  BORRADOR: "Borrador",
  PENDIENTE_APROBACION: "Pendiente de respuesta",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  VENCIDO: "Vencido",
  CANCELADO: "Cancelado",
};
