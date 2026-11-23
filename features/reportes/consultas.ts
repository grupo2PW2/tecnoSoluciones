import "server-only";

import { and } from "@prisma/orm-postgres/orm-client";
import { tiposDispositivo } from "@/features/dispositivos/modelo";
import { estadosOrden, textoCliente, textoEquipo } from "@/features/ordenes/modelo";
import { db } from "@/src/prisma/db";
import { limitesReporte, type FiltrosOrdenesReporte, type PeriodoReporte } from "./filtros";

const ordenesPorPagina = 15;
const colacion = new Intl.Collator("es-BO");
const estadosReparados = ["LISTO", "ENTREGADO"] as const;

export async function consultarOrdenesReporte(periodo: PeriodoReporte, filtros: FiltrosOrdenesReporte) {
  const { inicio, fin } = limitesReporte(periodo);
  const ordenes = db.orm.public.Orden.where((orden) => and(orden.fechaIngreso.gte(inicio), orden.fechaIngreso.lt(fin)));
  const resumen = await ordenes.groupBy("estado").aggregate((agregado) => ({ total: agregado.count() }));
  const totalPeriodo = resumen.reduce((total, fila) => total + fila.total, 0);
  const total = filtros.estado === "todos" ? totalPeriodo : resumen.find(({ estado }) => estado === filtros.estado)?.total ?? 0;
  const totalPaginas = Math.max(1, Math.ceil(total / ordenesPorPagina));
  const pagina = Math.min(filtros.pagina, totalPaginas);
  const coincidencias = filtros.estado === "todos" ? ordenes : ordenes.where({ estado: filtros.estado });
  const filas = total === 0 ? [] : await coincidencias.select("id", "codigo", "estado", "fechaIngreso")
    .include("dispositivo", (equipo) => equipo.select("marca", "modelo"))
    .include("tecnicoResponsable", (tecnico) => tecnico.select("nombre", "apellido"))
    .orderBy([(orden) => orden.fechaIngreso.desc(), (orden) => orden.id.desc()])
    .limit(ordenesPorPagina).offset((pagina - 1) * ordenesPorPagina).all();

  return {
    total, totalPeriodo, totalPaginas, pagina,
    porEstado: resumen.map(({ estado, total }) => ({ etiqueta: estadosOrden[estado], total }))
      .sort((a, b) => b.total - a.total || colacion.compare(a.etiqueta, b.etiqueta)),
    ordenes: filas.map(({ dispositivo, tecnicoResponsable, fechaIngreso, ...orden }) => ({
      ...orden, fechaIngreso: fechaIngreso.toISOString(),
      equipo: dispositivo ? textoEquipo(dispositivo) : "Equipo no disponible",
      tecnico: tecnicoResponsable ? textoCliente(tecnicoResponsable) : "Sin asignar",
    })),
  };
}

export async function consultarTrabajoReporte(periodo: PeriodoReporte) {
  const { inicio, fin } = limitesReporte(periodo);
  const [reparaciones, consumos] = await Promise.all([
    db.orm.public.Orden.where((orden) => and(orden.estado.in([...estadosReparados]),
      orden.fechaCierreTecnico.gte(inicio), orden.fechaCierreTecnico.lt(fin)))
      .select("id", "tecnicoId")
      .include("tecnicoResponsable", (tecnico) => tecnico.select("nombre", "apellido"))
      .include("dispositivo", (equipo) => equipo.select("tipo", "marca", "modelo"))
      .orderBy((orden) => orden.id.asc()).all(),
    db.orm.public.DetalleMovimientos.where((partida) => partida.movimiento.some((movimiento) => and(
      movimiento.tipo.eq("SALIDA_REPARACION"), movimiento.ordenId.isNotNull(),
      movimiento.fecha.gte(inicio), movimiento.fecha.lt(fin),
    ))).groupBy("repuestoId").aggregate((agregado) => ({ unidades: agregado.sum("cantidad") })),
  ]);

  const tecnicos = new Map<number | null, { nombre: string; total: number }>();
  const equipos = new Map<string, { nombre: string; tipo: string; total: number }>();
  for (const { tecnicoId, tecnicoResponsable, dispositivo } of reparaciones) {
    const tecnico = tecnicos.get(tecnicoId);
    if (tecnico) tecnico.total++;
    else tecnicos.set(tecnicoId, { nombre: tecnicoResponsable ? textoCliente(tecnicoResponsable) : "Sin técnico registrado", total: 1 });

    if (dispositivo) {
      const { tipo, marca, modelo } = dispositivo;
      const clave = JSON.stringify([tipo, marca.trim().toLowerCase(), modelo.trim().toLowerCase()]);
      const equipo = equipos.get(clave);
      if (equipo) equipo.total++;
      else equipos.set(clave, { nombre: textoEquipo(dispositivo), tipo: tiposDispositivo[tipo], total: 1 });
    }
  }

  const catalogo = consumos.length === 0 ? [] : await db.orm.public.Repuestos
    .where((repuesto) => repuesto.id.in(consumos.map(({ repuestoId }) => repuestoId)))
    .select("id", "nombre", "sku").all();
  const unidades = new Map(consumos.map(({ repuestoId, unidades }) => [repuestoId, unidades ?? 0]));

  return {
    tecnicos: [...tecnicos].map(([id, datos]) => ({ id, ...datos }))
      .sort((a, b) => b.total - a.total || colacion.compare(a.nombre, b.nombre)),
    equipos: [...equipos].map(([id, datos]) => ({ id, ...datos }))
      .sort((a, b) => b.total - a.total || colacion.compare(a.nombre, b.nombre) || colacion.compare(a.tipo, b.tipo)),
    repuestos: catalogo.map((repuesto) => ({ ...repuesto, unidades: unidades.get(repuesto.id) ?? 0 }))
      .sort((a, b) => b.unidades - a.unidades || colacion.compare(a.nombre, b.nombre)),
  };
}

export type OrdenesReporte = Awaited<ReturnType<typeof consultarOrdenesReporte>>;
export type TrabajoReporte = Awaited<ReturnType<typeof consultarTrabajoReporte>>;
