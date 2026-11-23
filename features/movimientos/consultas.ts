import "server-only";

import { db } from "@/src/prisma/db";
import { textoCliente } from "@/features/ordenes/modelo";
import type { MovimientoInventario } from "./modelo";

export async function listarMovimientos(): Promise<MovimientoInventario[]> {
  const movimientos = await db.orm.public.Movimientos
    .select("id", "tipo", "fecha", "observaciones")
    .include("orden", (orden) => orden.select("id", "codigo"))
    .include("registradoPor", (usuario) => usuario.select("nombre", "apellido"))
    .include("detalleMovimientos", (detalle) => detalle.select("id", "cantidad", "costoUnitario", "costoTotal", "precioUnitario", "margenAplicado")
      .include("repuesto", (repuesto) => repuesto.select("nombre", "sku"))
      .orderBy((partida) => partida.id.asc()))
    .orderBy([(movimiento) => movimiento.fecha.desc(), (movimiento) => movimiento.id.desc()]).limit(20).all();

  return movimientos.map((movimiento) => ({
    tipo: movimiento.tipo,
    orden: movimiento.orden,
    id: movimiento.id,
    fecha: movimiento.fecha.toISOString(),
    referencia: movimiento.observaciones,
    responsable: movimiento.registradoPor ? textoCliente(movimiento.registradoPor) : null,
    partidas: movimiento.detalleMovimientos.map(({ repuesto, ...partida }) => ({
      ...partida, nombre: repuesto?.nombre ?? "Repuesto", sku: repuesto?.sku ?? null,
    })),
  }));
}
