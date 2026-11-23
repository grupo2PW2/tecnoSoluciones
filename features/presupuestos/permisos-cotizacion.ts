import "server-only";

import { puedeRegistrarIngreso, puedeTomarOrdenes } from "@/features/ordenes/modelo";
import type { db } from "@/src/prisma/db";

export type Cotizador = { tipo: "recepcion" } | { tipo: "tecnico"; id: number };

export function cotizadorParaUsuario(usuario: { id: number; rol: string } | null): Cotizador | null {
  if (!usuario) return null;
  if (puedeRegistrarIngreso(usuario.rol)) return { tipo: "recepcion" };
  if (puedeTomarOrdenes(usuario.rol)) return { tipo: "tecnico", id: usuario.id };
  return null;
}

export async function bloquearOrdenParaCotizar(tx: Pick<typeof db, "orm">, ordenId: number, cotizador: Cotizador) {
  const orden = await tx.orm.public.Orden.where({ id: ordenId })
    .select("id", "tecnicoId", "estado", "tipoIngreso", "fechaCierreTecnico").forNoKeyUpdate().first();
  if (!orden) return { ok: false, error: "No se encontró la orden." } as const;

  if (cotizador.tipo === "tecnico") {
    if (orden.tecnicoId !== cotizador.id) return { ok: false, error: "La orden no está asignada a tu usuario." } as const;
    if (orden.tipoIngreso !== "DIAGNOSTICO") return { ok: false, error: "Recepción prepara los presupuestos de servicio directo." } as const;
  } else if (orden.tipoIngreso !== "SERVICIO_DIRECTO") {
    return { ok: false, error: "El técnico asignado prepara los presupuestos de órdenes con diagnóstico." } as const;
  }
  return { ok: true, orden } as const;
}
