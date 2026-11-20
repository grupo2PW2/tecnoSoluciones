import "server-only";
import { or } from "@prisma/orm-postgres/orm-client";
import { db } from "@/src/prisma/db";

import type { FiltrosClientes } from "./filters";

export async function obtenerClientesPaginados({
  buscar,
  page,
  limit,
}: FiltrosClientes) {
  const patron = `%${buscar}%`;

  function clientesFiltrados(buscar: string) {
    if (!buscar) {
      return db.orm.public.Clientes;
    }

    const patron = `%${buscar}%`;

    return db.orm.public.Clientes.where((c) =>
      or(
        c.nombre.ilike(patron),
        c.apellido.ilike(patron),
        c.telefono.ilike(patron),
      ),
    );
  }

  const totalResultado = await clientesFiltrados(buscar).aggregate((a) => ({
    total: a.count(),
  }));

  const total = totalResultado.total;
  const totalPaginas = Math.ceil(total / limit);
  const pagina = totalPaginas === 0 ? 1 : Math.min(page, totalPaginas);

  const clientes = await clientesFiltrados(buscar)
    .select("id", "nombre", "apellido", "telefono", "direccion")
    .orderBy((c) => c.id.desc())
    .limit(limit)
    .offset((pagina - 1) * limit)
    .all();

  return {
    clientes,
    total,
    pagina,
    totalPaginas,
  };
}
