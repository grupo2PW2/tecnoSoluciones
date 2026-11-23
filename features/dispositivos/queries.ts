
import "server-only";

import { and, or } from "@prisma/orm-postgres/orm-client";
import { db } from "@/src/prisma/db";
import type { FiltrosClientes } from "@/features/clientes/filters";

export async function buscarDispositivos(clienteId: number, buscar: string) {
  const patron = "%" + buscar + "%";
  const equipos = db.orm.public.Dispositivos.where({ clienteId });
  const filtrados = buscar ? equipos.where((equipo) => or(
    equipo.marca.ilike(patron),
    equipo.modelo.ilike(patron),
    equipo.nroSerie.ilike(patron),
  )) : equipos;

  return filtrados.select("id", "marca", "modelo", "nroSerie")
    .orderBy((equipo) => equipo.id.desc()).limit(12).all();
}

export async function listarEquiposDeCliente(clienteId: number) {
  return db.orm.public.Dispositivos.where({ clienteId })
    .select("id", "tipo", "marca", "modelo", "nroSerie", "clienteId", "imgUrl")
    .orderBy((equipo) => equipo.id.desc()).all();
}

export async function obtenerEquiposPaginados({ buscar, page, limit }: FiltrosClientes) {
  const equipos = buscar ? db.orm.public.Dispositivos.where((equipo) => and(...buscar.split(/\s+/).map((termino) => {
    const patron = "%" + termino + "%";
    return or(
      equipo.marca.ilike(patron),
      equipo.modelo.ilike(patron),
      equipo.nroSerie.ilike(patron),
      equipo.cliente.some((cliente) => or(cliente.nombre.ilike(patron), cliente.apellido.ilike(patron))),
    );
  }))) : db.orm.public.Dispositivos;
  const { total } = await equipos.aggregate((agregado) => ({ total: agregado.count() }));
  const totalPaginas = Math.ceil(total / limit);
  const pagina = totalPaginas === 0 ? 1 : Math.min(page, totalPaginas);
  const dispositivos = await equipos.select("id", "tipo", "marca", "modelo", "nroSerie", "clienteId", "imgUrl")
    .include("cliente", (cliente) => cliente.select("id", "nombre", "apellido"))
    .orderBy((equipo) => equipo.id.desc()).limit(limit).offset((pagina - 1) * limit).all();
  return { dispositivos, total, totalPaginas, pagina };
}

export type EquipoFicha = Awaited<ReturnType<typeof listarEquiposDeCliente>>[number];
