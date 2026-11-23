import "server-only";

import { db } from "@/src/prisma/db";
import { estadoSegunExistencias } from "./modelo";
import type { DatosAltaRepuesto, DatosEdicionRepuesto } from "./schemas";

export async function crearRepuesto(datos: DatosAltaRepuesto, imgUrl?: string) {
  try {
    await db.transaction(async (tx) => {
      const repuesto = await tx.orm.public.Repuestos.select("id").create({ ...datos, estado: "AGOTADO", ...(imgUrl !== undefined && { imgUrl }) });
      await tx.orm.public.Inventario.create({ repuestoId: repuesto.id, stock: 0 });
    });
    return { creado: true } as const;
  } catch (error) {
    const existente = await db.orm.public.Repuestos.select("id").first({ sku: datos.sku }).catch(() => null);
    if (existente) return { error: "Ya existe un repuesto con ese código." } as const;
    throw error;
  }
}

export async function editarRepuesto(id: number, { modoEstado, ...datos }: DatosEdicionRepuesto, imgUrl?: string | null) {
  try {
    return await db.transaction(async (tx) => {
      const repuesto = await tx.orm.public.Repuestos.where({ id }).select("id", "imgUrl").forNoKeyUpdate().first();
      if (!repuesto) return { error: "El repuesto ya no está en el catálogo." } as const;
      const existencia = await tx.orm.public.Inventario.select("stock").first({ repuestoId: id });
      const estado = modoEstado === "SEGUN_EXISTENCIAS" ? estadoSegunExistencias(existencia?.stock ?? 0) : modoEstado;
      await tx.orm.public.Repuestos.where({ id }).update({ ...datos, estado, ...(imgUrl !== undefined && { imgUrl }) });
      return { actualizado: true, imagenAnterior: imgUrl !== undefined ? repuesto.imgUrl : null } as const;
    });
  } catch (error) {
    const existente = await db.orm.public.Repuestos.select("id").first({ sku: datos.sku }).catch(() => null);
    if (existente && existente.id !== id) return { error: "Ya existe un repuesto con ese código." } as const;
    throw error;
  }
}
