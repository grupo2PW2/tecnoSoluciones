import "server-only";

import { and } from "@prisma/orm-postgres/orm-client";
import { calcularTotalVenta } from "@/features/inventario/precios";
import { listarTecnicosIngreso } from "@/features/ordenes/asignacion";
import { estadosAsignables, estadosOrden, textoEquipo, type EstadoOrden } from "@/features/ordenes/modelo";
import { fechaBolivia, fechaEstimadaLocal } from "@/features/presupuestos/fechas";
import { db } from "@/src/prisma/db";

const diaMs = 86_400_000;
const fechaCorta = new Intl.DateTimeFormat("es-BO", { timeZone: "America/La_Paz", day: "numeric", month: "short" });

function periodoBolivia(ahora: Date, cantidad: number) {
  const hoy = fechaEstimadaLocal(fechaBolivia(ahora)).getTime();
  const inicio = new Date(hoy - (cantidad - 1) * diaMs);
  const fin = new Date(hoy + diaMs);
  const dias = Array.from({ length: cantidad }, (_, indice) => {
    const fecha = new Date(inicio.getTime() + indice * diaMs);
    return { id: fechaBolivia(fecha), dia: fechaCorta.format(fecha), recibidas: 0, entregadas: 0 };
  });
  return { inicio, fin, dias };
}

const sinTecnico = () => db.orm.public.Orden
  .where((orden) => and(orden.tecnicoId.isNull(), orden.fechaCierreTecnico.isNull(), orden.estado.in([...estadosAsignables])));
const listas = () => db.orm.public.Orden.where({ estado: "LISTO" });
const ofertasVigentes = (ahora: Date) => db.orm.public.Presupuestos.where({ estado: "PENDIENTE_APROBACION" })
  .where((presupuesto) => and(presupuesto.fechaVencimiento.gt(ahora), presupuesto.fechaPresentacion.isNotNull(), presupuesto.total.isNotNull()))
  .where((presupuesto) => presupuesto.orden.some((orden) => and(orden.estado.eq("PENDIENTE_APROBACION"), orden.tipoIngreso.eq("DIAGNOSTICO"))));

const ordenBreve = ["id", "codigo", "estado", "tipoIngreso", "fechaIngreso"] as const;

function primerasSinTecnico() {
  return sinTecnico().select(...ordenBreve).include("dispositivo", (equipo) => equipo.select("marca", "modelo"))
    .orderBy([(orden) => orden.fechaIngreso.asc(), (orden) => orden.id.asc()]).limit(3).all();
}

async function actividad(ahora: Date, cantidad: number) {
  const { inicio, fin, dias } = periodoBolivia(ahora, cantidad);
  const [recibidas, salidas] = await Promise.all([
    db.orm.public.Orden.where((orden) => and(orden.fechaIngreso.gte(inicio), orden.fechaIngreso.lt(fin)))
      .select("fechaIngreso").all(),
    db.orm.public.Orden.where((orden) => and(orden.fechaEntregaCliente.gte(inicio), orden.fechaEntregaCliente.lt(fin)))
      .select("fechaEntregaCliente", "estado", "montoCobrado").all(),
  ]);
  const porDia = new Map(dias.map((dia) => [dia.id, dia]));
  for (const orden of recibidas) {
    const dia = porDia.get(fechaBolivia(orden.fechaIngreso));
    if (dia) dia.recibidas++;
  }
  for (const orden of salidas) {
    if (!orden.fechaEntregaCliente || orden.estado !== "ENTREGADO") continue;
    const dia = porDia.get(fechaBolivia(orden.fechaEntregaCliente));
    if (dia) dia.entregadas++;
  }
  return { dias, inicio, fin, salidas };
}

async function pendientesRecepcion(ahora: Date) {
  const [asignacion, porEntregar, ofertas, totalSinTecnico, totalListas, totalOfertas] = await Promise.all([
    primerasSinTecnico(),
    listas().select(...ordenBreve).include("dispositivo", (equipo) => equipo.select("marca", "modelo"))
      .orderBy([(orden) => orden.fechaCierreTecnico.asc(), (orden) => orden.id.asc()]).limit(3).all(),
    ofertasVigentes(ahora).select("id")
      .include("orden", (orden) => orden.select(...ordenBreve).include("dispositivo", (equipo) => equipo.select("marca", "modelo")))
      .orderBy((oferta) => oferta.fechaVencimiento.asc()).limit(3).all(),
    sinTecnico().aggregate((a) => ({ total: a.count() })),
    listas().aggregate((a) => ({ total: a.count() })),
    ofertasVigentes(ahora).aggregate((a) => ({ total: a.count() })),
  ]);

  return {
    asignacion, porEntregar, ofertas: ofertas.flatMap(({ orden }) => orden ? [orden] : []),
    totales: { sinTecnico: totalSinTecnico.total, listas: totalListas.total, ofertas: totalOfertas.total },
  };
}

export async function consultarDashboardRecepcion(ahora = new Date()) {
  const [hoy, pendientes] = await Promise.all([actividad(ahora, 1), pendientesRecepcion(ahora)]);
  return { hoy: hoy.dias[0], pendientes };
}

export async function consultarDashboardAdministracion(ahora = new Date()) {
  const semana = await actividad(ahora, 7);
  const [activas, totalListas, existencias, ventas, asignacion] = await Promise.all([
    db.orm.public.Orden.where((orden) => orden.estado.in([...estadosAsignables])).aggregate((a) => ({ total: a.count() })),
    listas().aggregate((a) => ({ total: a.count() })),
    db.orm.public.Inventario.where((actual) => actual.stockMinimo.gt(0)).select("stock", "stockMinimo").all(),
    db.orm.public.Movimientos.where({ tipo: "SALIDA_VENTA" })
      .where((movimiento) => and(movimiento.fecha.gte(semana.inicio), movimiento.fecha.lt(semana.fin)))
      .select("id").include("detalleMovimientos", (detalle) => detalle.select("cantidad", "precioUnitario")).all(),
    primerasSinTecnico(),
  ]);
  const cobros = calcularTotalVenta(semana.salidas.flatMap(({ montoCobrado }) =>
    montoCobrado === null ? [] : [{ cantidad: 1, precioUnitario: montoCobrado }])) ?? "0.00";
  const ventaDirecta = calcularTotalVenta(ventas.flatMap(({ detalleMovimientos }) =>
    detalleMovimientos.filter(({ precioUnitario }) => precioUnitario !== null))) ?? "0.00";

  return {
    dias: semana.dias, activas: activas.total, listas: totalListas.total,
    bajoMinimo: existencias.filter(({ stock, stockMinimo }) => stock <= stockMinimo).length,
    cobros, ventaDirecta, asignacion,
  };
}

export async function consultarDashboardGerencia(ahora = new Date()) {
  const [estados, pendientes, tecnicos, semana] = await Promise.all([
    db.orm.public.Orden.groupBy("estado").aggregate((agregado) => ({ total: agregado.count() })),
    sinTecnico().aggregate((agregado) => ({ total: agregado.count() })),
    listarTecnicosIngreso(),
    actividad(ahora, 7),
  ]);
  const conteo = new Map<string, number>(estados.map(({ estado, total }) => [estado, total]));

  return {
    totalOrdenes: estados.reduce((total, estado) => total + estado.total, 0),
    sinTecnico: pendientes.total,
    listas: conteo.get("LISTO") ?? 0,
    porEstado: Object.entries(estadosOrden).flatMap(([estado, etiqueta]) => {
      const total = conteo.get(estado) ?? 0;
      return total > 0 ? [{ etiqueta, total }] : [];
    }),
    tecnicos: tecnicos.sort((a, b) => b.ordenesActivas - a.ordenesActivas),
    dias: semana.dias,
  };
}

export async function consultarDashboardTecnico(tecnicoId: number) {
  const ordenes = await db.orm.public.Orden.where({ tecnicoId }).where((orden) => orden.fechaCierreTecnico.isNull())
    .select(...ordenBreve).include("dispositivo", (equipo) => equipo.select("marca", "modelo"))
    .orderBy([(orden) => orden.fechaIngreso.asc(), (orden) => orden.id.asc()]).all();
  const conteo = new Map<EstadoOrden, number>();
  for (const orden of ordenes) conteo.set(orden.estado, (conteo.get(orden.estado) ?? 0) + 1);
  return {
    ordenes,
    porEstado: Array.from(conteo, ([estado, total]) => ({ etiqueta: estadosOrden[estado], total })),
  };
}

export function equipoDashboard(equipo: { marca: string; modelo: string } | null) {
  return equipo ? textoEquipo(equipo) : "Equipo sin registrar";
}
