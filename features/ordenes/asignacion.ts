
import "server-only";

import { db } from "@/src/prisma/db";
import { cuposTecnico, estadosAsignables, textoCliente } from "./modelo";

export async function contarOrdenesActivas(tx: Pick<typeof db, "orm">, tecnicoId: number) {
  const { total } = await tx.orm.public.Orden.where({ tecnicoId })
    .where((orden) => orden.fechaCierreTecnico.isNull())
    .aggregate((agregado) => ({ total: agregado.count() }));
  return total;
}

export async function validarCupoTecnico(tx: Pick<typeof db, "orm">, tecnicoId: number) {
  // Serializa las asignaciones al mismo técnico hasta que termine la transacción.
  const tecnico = await tx.orm.public.Usuarios.where({ id: tecnicoId, rol: "TECNICO", activo: true })
    .select("id").forNoKeyUpdate().first();
  if (!tecnico) return "El técnico seleccionado ya no está disponible.";

  const total = await contarOrdenesActivas(tx, tecnicoId);
  return total >= cuposTecnico ? "El técnico ya tiene tres órdenes activas." : null;
}

export async function asignarOrdenDisponible(ordenId: number, tecnicoId: number) {
  return db.transaction(async (tx) => {
    const orden = await tx.orm.public.Orden.where({ id: ordenId })
      .select("id", "tecnicoId", "fechaCierreTecnico", "estado").forNoKeyUpdate().first();
    if (!orden || orden.fechaCierreTecnico || !estadosAsignables.includes(orden.estado)) {
      return { error: "Esta orden ya no admite una asignación." };
    }

    if (orden.tecnicoId === tecnicoId) return { asignada: true };
    if (orden.tecnicoId !== null) return { error: "Esta orden ya tiene un técnico asignado." };

    const error = await validarCupoTecnico(tx, tecnicoId);
    if (error) return { error };

    await tx.orm.public.Orden.where({ id: orden.id }).update({ tecnicoId });
    return { asignada: true };
  });
}

export async function listarTecnicosIngreso() {
  const tecnicos = await db.orm.public.Usuarios.where({ rol: "TECNICO", activo: true })
    .select("id", "nombre", "apellido")
    .include("tecnico", (ordenes) => ordenes.where((orden) => orden.fechaCierreTecnico.isNull()).count())
    .orderBy([(tecnico) => tecnico.nombre.asc(), (tecnico) => tecnico.apellido.asc(), (tecnico) => tecnico.id.asc()])
    .all();

  return tecnicos.map((tecnico) => ({
    id: tecnico.id,
    etiqueta: textoCliente(tecnico),
    ordenesActivas: tecnico.tecnico,
  }));
}
