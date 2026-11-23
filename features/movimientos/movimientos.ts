import "server-only";

import { bloquearConfiguracionGanancia } from "@/features/configuracion/consultas";
import { db } from "@/src/prisma/db";
import type { TipoMovimientoRegistrable } from "./modelo";

type ResultadoMovimiento = { registrada: true; id: number; repetida: boolean } | { error: string };
type Transaccion = Pick<typeof db, "orm">;

async function buscarMovimiento(tx: Transaccion, solicitudId: string, usuarioId: number,
  tipo: TipoMovimientoRegistrable): Promise<ResultadoMovimiento | null> {
  const existente = await tx.orm.public.Movimientos.select("id", "tipo", "registradoPorId").first({ solicitudId });
  if (!existente) return null;
  if (existente.tipo === tipo && existente.registradoPorId === usuarioId) {
    return { registrada: true, id: existente.id, repetida: true };
  }
  return { error: "Ese identificador ya corresponde a otro movimiento. Abre un nuevo formulario." };
}

async function bloquearExistencias(tx: Transaccion, ids: number[]) {
  // Conserva el mismo orden de bloqueo que las salidas por reparación.
  const repuestos = await tx.orm.public.Repuestos.where((repuesto) => repuesto.id.in(ids))
    .select("id", "nombre", "unidadesCaja", "estado", "costoActual", "precioVenta")
    .orderBy((repuesto) => repuesto.id.asc()).forNoKeyUpdate().all();
  const inventario = await tx.orm.public.Inventario.where((existencia) => existencia.repuestoId.in(ids))
    .select("repuestoId", "stock").orderBy((existencia) => existencia.repuestoId.asc()).forNoKeyUpdate().all();

  return {
    catalogo: new Map(repuestos.map((repuesto) => [repuesto.id, repuesto])),
    existencias: new Map(inventario.map((existencia) => [existencia.repuestoId, existencia.stock])),
  };
}

type SaldosBloqueados = Awaited<ReturnType<typeof bloquearExistencias>>;

export async function registrarMovimientoInventario(
  tipo: TipoMovimientoRegistrable,
  datos: { solicitudId: string; partidas: readonly { repuestoId: number; cajas: number; unidadesCaja?: number }[] },
  usuarioId: number,
  guardar: (tx: Transaccion, catalogo: SaldosBloqueados["catalogo"], existencias: SaldosBloqueados["existencias"]) => Promise<ResultadoMovimiento>,
): Promise<ResultadoMovimiento> {
  try {
    return await db.transaction(async (tx) => {
      const registrada = await buscarMovimiento(tx, datos.solicitudId, usuarioId, tipo);
      if (registrada) return registrada;
      if (tipo === "ENTRADA") await bloquearConfiguracionGanancia(tx, "lectura");
      const { catalogo, existencias } = await bloquearExistencias(tx, datos.partidas.map((partida) => partida.repuestoId));
      const concurrente = await buscarMovimiento(tx, datos.solicitudId, usuarioId, tipo);
      if (concurrente) return concurrente;

      for (const { repuestoId, cajas, unidadesCaja } of datos.partidas) {
        const repuesto = catalogo.get(repuestoId);
        if (cajas > 0 && repuesto && repuesto.unidadesCaja !== unidadesCaja) {
          return { error: "Revisa la presentación de " + repuesto.nombre + ". Quita esa línea y agrégala de nuevo antes de guardar." };
        }
      }
      return guardar(tx, catalogo, existencias);
    });
  } catch (error) {
    const existente = await buscarMovimiento(db, datos.solicitudId, usuarioId, tipo).catch(() => null);
    if (existente) return existente;
    throw error;
  }
}
