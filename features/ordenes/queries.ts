
import "server-only";

import { or } from "@prisma/orm-postgres/orm-client";
import { db } from "@/src/prisma/db";
import { contarOrdenesActivas } from "./asignacion";
import { estadosAsignables, textoCliente, textoEquipo, type EstadoOrden, type TicketIngreso, type VistaTecnica } from "./modelo";

export async function listarOrdenes(
  buscar: string,
  estado: EstadoOrden | undefined,
  pagina: number,
  alcance?: { vista: VistaTecnica; tecnicoId: number },
) {
  const patron = "%" + buscar + "%";
  const todas = db.orm.public.Orden;
  const ordenes = alcance?.vista === "disponibles"
    ? todas.where((orden) => orden.tecnicoId.isNull())
        .where((orden) => orden.fechaCierreTecnico.isNull())
        .where((orden) => orden.estado.in([...estadosAsignables]))
    : alcance ? todas.where({ tecnicoId: alcance.tecnicoId }) : todas;
  const porEstado = estado ? ordenes.where({ estado }) : ordenes;
  const filtradas = buscar ? porEstado.where((orden) => or(
    orden.codigo.ilike(patron),
    orden.dispositivo.some((equipo) => or(
      equipo.marca.ilike(patron),
      equipo.modelo.ilike(patron),
      equipo.nroSerie.ilike(patron),
      equipo.cliente.some((cliente) => or(
        cliente.nombre.ilike(patron),
        cliente.apellido.ilike(patron),
        ...(alcance ? [] : [cliente.telefono.ilike(patron)]),
      )),
    )),
  )) : porEstado;

  const limite = 15;
  const { total } = await filtradas.aggregate((agregado) => ({ total: agregado.count() }));
  const totalPaginas = Math.max(1, Math.ceil(total / limite));
  const paginaActual = Math.min(pagina, totalPaginas);

  const filas = await filtradas
    .select("id", "codigo", "fechaIngreso", "estado", "tipoIngreso", "tecnicoId", "fechaCierreTecnico", "problemasReportados")
    .include("dispositivo", (equipo) => equipo.select("marca", "modelo")
      .include("cliente", (cliente) => cliente.select("nombre", "apellido")))
    .include("tecnicoResponsable", (tecnico) => tecnico.select("nombre", "apellido"))
    .orderBy([(orden) => orden.fechaIngreso.desc(), (orden) => orden.id.desc()])
    .limit(limite)
    .offset((paginaActual - 1) * limite)
    .all();

  return {
    total,
    totalPaginas,
    pagina: paginaActual,
    ordenes: filas.map((orden) => ({
      id: orden.id,
      codigo: orden.codigo,
      fechaIngreso: orden.fechaIngreso.toISOString(),
      estado: orden.estado,
      tipoIngreso: orden.tipoIngreso,
      equipo: orden.dispositivo ? textoEquipo(orden.dispositivo) : "Equipo no disponible",
      cliente: orden.dispositivo?.cliente ? textoCliente(orden.dispositivo.cliente) : "Cliente no disponible",
      asignable: orden.tecnicoId === null && orden.fechaCierreTecnico === null && estadosAsignables.includes(orden.estado),
      tecnico: orden.tecnicoResponsable ? textoCliente(orden.tecnicoResponsable) : "Sin asignar",
      ...(alcance && { problema: orden.problemasReportados, cierreTecnico: orden.fechaCierreTecnico?.toISOString() ?? null }),
    })),
  };
}

export type ResultadoOrdenes = Awaited<ReturnType<typeof listarOrdenes>>;

export async function listarBandejaTecnica(tecnicoId: number, vista: VistaTecnica, buscar: string, pagina: number) {
  const [resultado, ordenesActivas] = await Promise.all([
    listarOrdenes(buscar, undefined, pagina, { vista, tecnicoId }),
    contarOrdenesActivas(db, tecnicoId),
  ]);
  return { ...resultado, ordenesActivas };
}

export type ResultadoBandejaTecnica = Awaited<ReturnType<typeof listarBandejaTecnica>>;

function origenPublicoTicket() {
  const valor = process.env.URL_PUBLICA_SEGUIMIENTO?.trim();
  if (!valor || !URL.canParse(valor)) return null;

  const url = new URL(valor);
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password || url.pathname !== "/" || url.search || url.hash) return null;
  return url.origin;
}

export async function obtenerTicket(id: number): Promise<TicketIngreso | null> {
  const orden = await db.orm.public.Orden
    .select("codigo", "codigoCliente", "fechaIngreso")
    .include("dispositivo", (equipo) => equipo.select("marca", "modelo"))
    .first({ id });

  return orden?.dispositivo ? {
    codigo: orden.codigo,
    codigoCliente: orden.codigoCliente,
    fechaIngreso: orden.fechaIngreso.toISOString(),
    equipo: textoEquipo(orden.dispositivo),
    origenPublico: origenPublicoTicket(),
  } : null;
}

export async function obtenerSeguimiento(codigoCliente: string) {
  if (!codigoCliente || codigoCliente.length > 128) return null;

  return db.orm.public.Orden
    .select("id", "estado", "fechaIngreso", "fechaEntregaCliente", "tipoIngreso")
    .include("dispositivo", (equipo) => equipo.select("marca", "modelo"))
    .first({ codigoCliente });
}
