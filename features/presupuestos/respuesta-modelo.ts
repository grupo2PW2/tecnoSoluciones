
export type DecisionPresupuesto = "APROBAR" | "RECHAZAR";
export type CanalRespuesta = "WEB" | "EN_TIENDA";

export type OrigenRespuesta =
  | { canal: "WEB"; codigoCliente: string }
  | { canal: "EN_TIENDA"; ordenId: number };

export const canalesRespuesta: Record<CanalRespuesta, string> = {
  WEB: "En línea",
  EN_TIENDA: "En tienda",
};
