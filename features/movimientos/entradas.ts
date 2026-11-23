import "server-only";

import { calcularUnidadesMovimiento, maxUnidadesInventario } from "@/features/inventario/modelo";
import { registrarMovimientoInventario } from "./movimientos";
import { consultarGananciaSobreCosto } from "@/features/configuracion/consultas";
import { calcularPreciosEntrada, gananciaValida } from "@/features/inventario/precios";
import type { DatosEntrada } from "./schemas";

export function crearEntrada(datos: DatosEntrada, usuarioId: number) {
  return registrarMovimientoInventario("ENTRADA", datos, usuarioId, async (tx, catalogo, existencias) => {
    const margenGanancia = await consultarGananciaSobreCosto(tx);
    if (!gananciaValida(margenGanancia)) {
      return { error: "El porcentaje de ganancia de Configuración debe ser cero o mayor." };
    }

    const detalles: {
      repuestoId: number; cantidad: number; costoTotal: string; costoUnitario: string;
      costoActual: string; precioVenta: string; stock: number; existia: boolean;
    }[] = [];

    for (const { repuestoId, cajas, unidades, costoTotal } of datos.partidas) {
      const repuesto = catalogo.get(repuestoId);
      if (!repuesto) return { error: "Uno de los repuestos ya no está en el catálogo." };
      if (repuesto.estado === "DESCATALOGADO") return { error: repuesto.nombre + " está descatalogado. Quita esa línea." };
      if (cajas > 0 && repuesto.unidadesCaja <= 0) {
        return { error: repuesto.nombre + " se registra por unidad. Quita las cajas de esa línea." };
      }

      const cantidad = calcularUnidadesMovimiento(cajas, unidades, repuesto.unidadesCaja);
      const anterior = existencias.get(repuestoId);
      if (cantidad === null || (anterior ?? 0) + cantidad > maxUnidadesInventario) {
        return { error: "La entrada supera el stock máximo permitido para " + repuesto.nombre + "." };
      }
      if (cantidad === 0) return { error: "Indica al menos una unidad para " + repuesto.nombre + "." };

      const precios = calcularPreciosEntrada({ cantidad, costoTotal, stockAnterior: anterior ?? 0,
        costoAnterior: repuesto.costoActual, margenGanancia });
      if (!precios) return { error: "Revisa el costo o el precio resultante de " + repuesto.nombre + ". El importe debe estar dentro del rango permitido." };

      detalles.push({ repuestoId, cantidad, costoTotal, ...precios, stock: (anterior ?? 0) + cantidad, existia: anterior !== undefined });
    }

    const movimiento = await tx.orm.public.Movimientos.select("id").create({
      tipo: "ENTRADA",
      registradoPorId: usuarioId,
      solicitudId: datos.solicitudId,
      observaciones: datos.referencia || null,
    });
    for (const { repuestoId, cantidad, costoTotal, costoUnitario, costoActual, precioVenta, stock, existia } of detalles) {
      await tx.orm.public.DetalleMovimientos.create({
        movimientoId: movimiento.id, repuestoId, cantidad, costoTotal, costoUnitario, precioUnitario: null,
      });
      if (existia) {
        await tx.orm.public.Inventario.where({ repuestoId }).update({ stock });
      } else {
        await tx.orm.public.Inventario.create({ repuestoId, stock });
      }
      await tx.orm.public.Repuestos.where({ id: repuestoId }).update({ estado: "DISPONIBLE", costoActual, precioVenta });
    }

    return { registrada: true, id: movimiento.id, repetida: false };
  });
}
