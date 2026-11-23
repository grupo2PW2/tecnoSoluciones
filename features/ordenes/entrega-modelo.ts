
import type { EstadoOrden } from "./modelo";

export interface PartidaCobroEntrega {
  concepto: string;
  importe: string;
}

export type CobroEntrega =
  | { error: string }
  | {
    operacion: "entrega" | "devolucion";
    estadoFinal: Extract<EstadoOrden, "ENTREGADO" | "RECHAZADO_ENTREGADO" | "CANCELADO">;
    monto: string | null;
    partidas: PartidaCobroEntrega[];
  };
