import "server-only";

import { and } from "@prisma/orm-postgres/orm-client";
import { db } from "@/src/prisma/db";
import { calcularMargenSobreCosto } from "@/features/inventario/precios";
import type { RepuestoAutorizado, SolicitudConsumoRepuestos } from "./consumo-repuestos-modelo";
import { puedeEjecutarReparacion } from "./ejecucion-modelo";

function consultarPartidasAprobadas(tx: Pick<typeof db, "orm">, ordenId: number) {
  return tx.orm.public.PresupuestoRepuesto
    .where((partida) => partida.presupuesto.some((presupuesto) => and(
      presupuesto.ordenId.eq(ordenId), presupuesto.estado.eq("APROBADO"),
    )))
    .select("repuestoId", "cantidad", "precioUnitario")
    .include("repuesto", (repuesto) => repuesto.select("nombre", "sku", "unidadesCaja")
      .include("inventario", (inventario) => inventario.select("stock")))
    .orderBy([(partida) => partida.repuestoId.asc(), (partida) => partida.presupuestoId.asc()])
    .all();
}

function consultarSalidas(tx: Pick<typeof db, "orm">, ordenId: number) {
  return tx.orm.public.Movimientos.where({ ordenId, tipo: "SALIDA_REPARACION" })
    .select("id", "fecha")
    .include("registradoPor", (usuario) => usuario.select("nombre", "apellido"))
    .include("detalleMovimientos", (detalle) => detalle.select("id", "repuestoId", "cantidad")
      .include("repuesto", (repuesto) => repuesto.select("nombre"))
      .orderBy((partida) => partida.id.asc()))
    .orderBy([(movimiento) => movimiento.fecha.desc(), (movimiento) => movimiento.id.desc()])
    .all();
}

function sumarCantidadPorRepuesto(partidas: readonly { repuestoId: number; cantidad: number }[]) {
  const cantidades = new Map<number, number>();
  for (const { repuestoId, cantidad } of partidas) {
    cantidades.set(repuestoId, (cantidades.get(repuestoId) ?? 0) + cantidad);
  }
  return cantidades;
}

function repartirConsumoPorPrecio(
  partidas: readonly { repuestoId: number; cantidad: number; precioUnitario: string }[],
  repuestoId: number,
  utilizadas: number,
  cantidad: number,
) {
  // Imputa primero a las partidas autorizadas más antiguas, incluido el consumo histórico.
  const detalles: { cantidad: number; precioUnitario: string }[] = [];
  const totalUtilizado = utilizadas + cantidad;
  let acumuladas = 0;
  for (const partida of partidas) {
    if (partida.repuestoId !== repuestoId) continue;
    const fin = acumuladas + partida.cantidad;
    const unidades = Math.min(fin, totalUtilizado) - Math.max(acumuladas, utilizadas);
    if (unidades > 0) detalles.push({ cantidad: unidades, precioUnitario: partida.precioUnitario });
    if (fin >= totalUtilizado) break;
    acumuladas = fin;
  }
  return detalles;
}

export async function consultarConsumoRepuestos(ordenId: number) {
  const [partidas, salidas] = await Promise.all([
    consultarPartidasAprobadas(db, ordenId),
    consultarSalidas(db, ordenId),
  ]);
  const utilizadas = sumarCantidadPorRepuesto(salidas.flatMap((salida) => salida.detalleMovimientos));
  const autorizadas = sumarCantidadPorRepuesto(partidas);
  const repuestos = new Map<number, RepuestoAutorizado>();

  for (const { repuestoId, repuesto } of partidas) {
    if (repuestos.has(repuestoId)) continue;
    repuestos.set(repuestoId, {
      id: repuestoId,
      nombre: repuesto?.nombre ?? "Repuesto",
      sku: repuesto?.sku ?? "",
      autorizadas: autorizadas.get(repuestoId) ?? 0,
      utilizadas: utilizadas.get(repuestoId) ?? 0,
      stock: Math.max(0, repuesto?.inventario[0]?.stock ?? 0),
      unidadesCaja: repuesto?.unidadesCaja ?? 0,
    });
  }

  return { repuestos: [...repuestos.values()], salidas };
}

export async function registrarConsumoRepuestos(solicitud: SolicitudConsumoRepuestos, tecnicoId: number):
Promise<{ registrada: true; yaRegistrada?: true } | { error: string }> {
  return db.transaction(async (tx) => {
    const orden = await tx.orm.public.Orden.where({ id: solicitud.ordenId, tecnicoId })
      .select("id", "estado", "fechaCierreTecnico").forNoKeyUpdate().first();
    if (!orden) return { error: "La orden no está asignada a tu usuario." };
    if (!puedeEjecutarReparacion(orden.estado, orden.fechaCierreTecnico !== null)) {
      return { error: "La orden debe estar aprobada o en reparación para registrar repuestos." };
    }

    const partidas = await consultarPartidasAprobadas(tx, orden.id);
    const salidas = await consultarSalidas(tx, orden.id);
    const aprobadas = sumarCantidadPorRepuesto(partidas);
    const usadas = sumarCantidadPorRepuesto(salidas.flatMap((salida) => salida.detalleMovimientos));
    const nombres = new Map(partidas.map(({ repuestoId, repuesto }) => [repuestoId, repuesto?.nombre ?? "El repuesto"]));
    const pendientes: { repuestoId: number; cantidad: number }[] = [];

    for (const { repuestoId, registradas, totalUtilizado } of solicitud.partidas) {
      const limite = aprobadas.get(repuestoId);
      const nombre = nombres.get(repuestoId) ?? "El repuesto";
      if (!limite) return { error: "Uno de los repuestos solicitados no está aprobado para esta orden." };
      if (totalUtilizado > limite) {
        return { error: nombre + " supera la cantidad aprobada de " + limite + "." };
      }

      const actual = usadas.get(repuestoId) ?? 0;
      if (totalUtilizado === actual) continue;
      if (registradas !== actual) {
        return { error: "Cambió el total utilizado de " + nombre + ". Vuelve a abrir el panel para revisar lo registrado." };
      }
      pendientes.push({ repuestoId, cantidad: totalUtilizado - actual });
    }
    if (!pendientes.length) return { registrada: true, yaRegistrada: true };

    // Bloquea los saldos en el mismo orden aunque dos órdenes usen los mismos repuestos.
    const ids = pendientes.map((linea) => linea.repuestoId);
    const repuestos = await tx.orm.public.Repuestos.where((repuesto) => repuesto.id.in(ids))
      .select("id", "costoActual").orderBy((repuesto) => repuesto.id.asc()).forShare().all();
    const inventario = await tx.orm.public.Inventario.where((existencia) => existencia.repuestoId.in(ids))
      .select("repuestoId", "stock").orderBy((existencia) => existencia.repuestoId.asc()).forNoKeyUpdate().all();
    const costos = new Map(repuestos.map(({ id, costoActual }) => [id, costoActual]));
    const existencias = new Map(inventario.map(({ repuestoId, stock }) => [repuestoId, stock]));
    const detalles: {
      repuestoId: number; costoUnitario: string; saldo: number; partidas: ReturnType<typeof repartirConsumoPorPrecio>;
    }[] = [];

    for (const { repuestoId, cantidad } of pendientes) {
      const stock = Math.max(0, existencias.get(repuestoId) ?? 0);
      const costoUnitario = costos.get(repuestoId);
      if (costoUnitario === undefined || cantidad > stock) {
        const unidades = stock === 1 ? " unidad disponible." : " unidades disponibles.";
        return { error: (nombres.get(repuestoId) ?? "El repuesto") + " tiene " + stock + unidades + " Corrige la cantidad para registrar la salida." };
      }
      detalles.push({
        repuestoId, costoUnitario, saldo: stock - cantidad,
        partidas: repartirConsumoPorPrecio(partidas, repuestoId, usadas.get(repuestoId) ?? 0, cantidad),
      });
    }

    const movimiento = await tx.orm.public.Movimientos.select("id").create({
      ordenId: orden.id, registradoPorId: tecnicoId, tipo: "SALIDA_REPARACION",
    });
    for (const { repuestoId, costoUnitario, saldo, partidas } of detalles) {
      await tx.orm.public.Inventario.where({ repuestoId }).update({ stock: saldo });
      for (const { cantidad, precioUnitario } of partidas) {
        await tx.orm.public.DetalleMovimientos.create({
          movimientoId: movimiento.id, repuestoId, cantidad, costoUnitario, precioUnitario,
          margenAplicado: calcularMargenSobreCosto(precioUnitario, costoUnitario),
        });
      }
    }

    return { registrada: true };
  });
}
