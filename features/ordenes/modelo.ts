
export const estadosOrden = {
  RECIBIDO: "Recibido",
  EN_DIAGNOSTICO: "En diagnóstico",
  PENDIENTE_APROBACION: "Pendiente de aprobación",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
  RECHAZADO_ENTREGADO: "Devuelto tras rechazo",
  EN_REPARACION: "En reparación",
  LISTO: "Listo para entrega",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
} as const;

export type EstadoOrden = keyof typeof estadosOrden;
export type VistaTecnica = "disponibles" | "mis-ordenes";

export function puedeTomarOrdenes(rol?: string) {
  return rol === "TECNICO";
}

export const tiposIngreso = {
  DIAGNOSTICO: "Requiere diagnóstico",
  SERVICIO_DIRECTO: "Servicio directo",
} as const;

export interface OpcionIngreso {
  id: number;
  etiqueta: string;
}

export const cuposTecnico = 3;

export const estadosAsignables: readonly EstadoOrden[] = [
  "RECIBIDO", "EN_DIAGNOSTICO", "PENDIENTE_APROBACION", "APROBADO", "EN_REPARACION",
];

export interface TecnicoIngreso extends OpcionIngreso {
  ordenesActivas: number;
}

export interface TicketIngreso {
  codigo: string;
  codigoCliente: string;
  fechaIngreso: string;
  equipo: string;
  origenPublico: string | null;
}

export function fechaIngreso(fecha: string | Date) {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/La_Paz",
  }).format(new Date(fecha));
}

export function puedeRegistrarIngreso(rol?: string) {
  return rol === "RECEPCIONISTA" || rol === "ADMINISTRADOR";
}

export function puedeConsultarOrdenes(rol?: string) {
  return puedeRegistrarIngreso(rol) || rol === "GERENTE";
}

export function textoCliente(cliente: { nombre: string; apellido: string }) {
  return [cliente.nombre, cliente.apellido].filter(Boolean).join(" ");
}

export function textoEquipo(equipo: { marca: string; modelo: string }) {
  return [equipo.marca, equipo.modelo].filter(Boolean).join(" ");
}
