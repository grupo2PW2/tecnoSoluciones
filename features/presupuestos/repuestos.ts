import "server-only";

import { db } from "@/src/prisma/db";
import type { OpcionRepuesto } from "./modelo";

function consultarRepuestos(tx: Pick<typeof db, "orm">) {
  return tx.orm.public.Repuestos.select("id", "nombre", "sku", "estado", "precioVenta", "unidadesCaja");
}

function opcionRepuesto(
  repuesto: {
    id: number; nombre: string; sku: string; estado: string; precioVenta: string; unidadesCaja: number;
  },
  stock: number,
): OpcionRepuesto {
  return {
    id: repuesto.id,
    nombre: repuesto.nombre,
    sku: repuesto.sku,
    precioUnitario: repuesto.precioVenta,
    unidadesCaja: repuesto.unidadesCaja,
    stock: Math.max(0, stock),
    disponible: repuesto.estado === "DISPONIBLE",
  };
}

export async function listarRepuestosCotizables(): Promise<OpcionRepuesto[]> {
  const repuestos = await consultarRepuestos(db)
    .include("inventario", (inventario) => inventario.select("stock"))
    .orderBy([(repuesto) => repuesto.nombre.asc(), (repuesto) => repuesto.id.asc()])
    .all();
  return repuestos.map((repuesto) => opcionRepuesto(repuesto, repuesto.inventario[0]?.stock ?? 0));
}

export async function consultarRepuestosParaGuardar(tx: Pick<typeof db, "orm">, ids: number[]) {
  if (!ids.length) return new Map<number, OpcionRepuesto>();

  const repuestos = await consultarRepuestos(tx).where((repuesto) => repuesto.id.in(ids))
    .orderBy((repuesto) => repuesto.id.asc()).forShare().all();
  const inventario = await tx.orm.public.Inventario.where((existencia) => existencia.repuestoId.in(ids))
    .select("repuestoId", "stock").orderBy((existencia) => existencia.repuestoId.asc()).forShare().all();
  const stock = new Map(inventario.map((existencia) => [existencia.repuestoId, existencia.stock]));

  return new Map(repuestos.map((repuesto) => [repuesto.id, opcionRepuesto(repuesto, stock.get(repuesto.id) ?? 0)]));
}
