import "server-only";

import { db } from "@/src/prisma/db";
import type { RepuestoInventario } from "./modelo";

export async function listarRepuestos(): Promise<RepuestoInventario[]> {
  const repuestos = await db.orm.public.Repuestos
    .select("id", "sku", "nombre", "imgUrl", "unidadesCaja", "precioVenta", "costoActual", "estado")
    .include("inventario", (existencia) => existencia.select("stock", "stockMinimo"))
    .orderBy([(repuesto) => repuesto.nombre.asc(), (repuesto) => repuesto.id.asc()]).all();

  return repuestos.map(({ inventario: [existencia], ...repuesto }) => ({
    ...repuesto, stock: existencia?.stock ?? 0, stockMinimo: existencia?.stockMinimo ?? 0,
  }));
}
