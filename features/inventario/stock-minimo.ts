import "server-only";

import { db } from "@/src/prisma/db";
import { calcularUnidadesMovimiento } from "./modelo";
import type { DatosStockMinimo } from "./schemas";

export function actualizarStockMinimo({ repuestoId, cajas, unidades, unidadesCaja }: DatosStockMinimo) {
  return db.transaction(async (tx) => {
    // Los movimientos bloquean primero el repuesto y luego sus existencias.
    const repuesto = await tx.orm.public.Repuestos.where({ id: repuestoId })
      .select("unidadesCaja").forNoKeyUpdate().first();
    if (!repuesto) return { error: "El repuesto ya no está en el catálogo." } as const;
    if (repuesto.unidadesCaja !== unidadesCaja) {
      return { error: "Cambió la presentación del repuesto. Actualiza la página y revisa el mínimo." } as const;
    }

    const stockMinimo = calcularUnidadesMovimiento(cajas, unidades, repuesto.unidadesCaja);
    if (stockMinimo === null) {
      return { error: "Revisa la cantidad y la presentación del repuesto. El mínimo está fuera del rango permitido." } as const;
    }

    const existencia = await tx.orm.public.Inventario.select("stockMinimo").first({ repuestoId });
    if (!existencia) {
      await tx.orm.public.Inventario.create({ repuestoId, stock: 0, stockMinimo });
    } else if (existencia.stockMinimo !== stockMinimo) {
      await tx.orm.public.Inventario.where({ repuestoId }).update({ stockMinimo });
    }
    return { guardado: true } as const;
  });
}
