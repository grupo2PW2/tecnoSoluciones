import "server-only";

import { mostrarUnidades } from "@/lib/existencias";
import { calcularUnidadesMovimiento } from "@/features/inventario/modelo";
import { calcularMargenSobreCosto } from "@/features/inventario/precios";
import { registrarMovimientoInventario } from "./movimientos";
import type { DatosSalida, DatosVenta } from "./schemas";

export function crearSalida(datos: DatosSalida | DatosVenta, usuarioId: number, tipo: "SALIDA" | "SALIDA_VENTA" = "SALIDA") {
  return registrarMovimientoInventario(tipo, datos, usuarioId, async (tx, catalogo, existencias) => {
    const detalles: {
      repuestoId: number; cantidad: number; costoUnitario: string; precioUnitario: string | null; saldo: number; agotar: boolean;
    }[] = [];

    for (const partida of datos.partidas) {
      const { repuestoId, cajas, unidades } = partida;
      const repuesto = catalogo.get(repuestoId);
      if (!repuesto) return { error: "Uno de los repuestos ya no está en el catálogo." };
      if (cajas > 0 && repuesto.unidadesCaja <= 0) {
        return { error: repuesto.nombre + " se registra por unidad. Quita las cajas de esa línea." };
      }
      const cantidad = calcularUnidadesMovimiento(cajas, unidades, repuesto.unidadesCaja);
      if (!cantidad) return { error: "Indica una cantidad válida para " + repuesto.nombre + "." };

      const stock = Math.max(0, existencias.get(repuestoId) ?? 0);
      if (cantidad > stock) {
        return { error: "Stock insuficiente para " + repuesto.nombre + ". Disponible: " + mostrarUnidades(stock) + "." };
      }
      let precioUnitario: string | null = null;
      if (tipo === "SALIDA_VENTA") {
        if (repuesto.estado !== "DISPONIBLE" || Number(repuesto.precioVenta) <= 0) {
          return { error: repuesto.nombre + " no tiene un precio de venta disponible. Quita esa línea." };
        }
        if (!("precioUnitario" in partida) || partida.precioUnitario !== repuesto.precioVenta) {
          return { error: "Cambió el precio de " + repuesto.nombre + ". Revisa el total antes de confirmar la venta." };
        }
        precioUnitario = repuesto.precioVenta;
      }
      const saldo = stock - cantidad;
      detalles.push({ repuestoId, cantidad, costoUnitario: repuesto.costoActual, precioUnitario, saldo,
        agotar: saldo === 0 && repuesto.estado === "DISPONIBLE" });
    }

    const movimiento = await tx.orm.public.Movimientos.select("id").create({
      tipo, registradoPorId: usuarioId, solicitudId: datos.solicitudId, observaciones: datos.referencia || null,
    });
    for (const { repuestoId, cantidad, costoUnitario, precioUnitario, saldo, agotar } of detalles) {
      await tx.orm.public.Inventario.where({ repuestoId }).update({ stock: saldo });
      await tx.orm.public.DetalleMovimientos.create({
        movimientoId: movimiento.id, repuestoId, cantidad, costoUnitario, precioUnitario,
        margenAplicado: precioUnitario === null ? null : calcularMargenSobreCosto(precioUnitario, costoUnitario),
      });
      if (agotar) await tx.orm.public.Repuestos.where({ id: repuestoId }).update({ estado: "AGOTADO" });
    }

    return { registrada: true, id: movimiento.id, repetida: false };
  });
}
