import "server-only";

import { calcularPrecioVenta } from "@/features/inventario/precios";
import { db } from "@/src/prisma/db";
import { bloquearConfiguracionGanancia, consultarConfiguracionGanancia } from "./consultas";

export function guardarGananciaSobreCosto(margen: string, esperado: string) {
  return db.transaction(async (tx) => {
    await bloquearConfiguracionGanancia(tx, "escritura");
    const actual = await consultarConfiguracionGanancia(tx);
    if ((actual?.margenGanancia ?? "0.00") !== esperado) {
      return { error: "Cambió el porcentaje vigente. Cierra y vuelve a abrir el formulario para revisarlo." } as const;
    }
    if (actual?.margenGanancia === margen) return { guardado: true, actualizados: 0 } as const;

    const repuestos = await tx.orm.public.Repuestos.select("id", "nombre", "costoActual", "precioVenta")
      .orderBy((repuesto) => repuesto.id.asc()).forNoKeyUpdate().all();
    const cambios: { id: number; precioVenta: string }[] = [];
    for (const repuesto of repuestos) {
      const precioVenta = calcularPrecioVenta(repuesto.costoActual, margen);
      if (precioVenta === null) {
        return { error: "El precio calculado de " + repuesto.nombre + " está fuera del rango permitido. Revisa el porcentaje o el costo de referencia." } as const;
      }
      if (precioVenta !== repuesto.precioVenta) cambios.push({ id: repuesto.id, precioVenta });
    }

    if (actual) {
      await tx.orm.public.Configuracion.where({ id: actual.id }).update({ margenGanancia: margen });
    } else {
      await tx.orm.public.Configuracion.create({ margenGanancia: margen });
    }
    for (const { id, precioVenta } of cambios) {
      await tx.orm.public.Repuestos.where({ id }).update({ precioVenta });
    }
    return { guardado: true, actualizados: cambios.length } as const;
  });
}
