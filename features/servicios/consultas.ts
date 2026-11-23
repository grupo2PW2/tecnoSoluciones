
import "server-only";

import { db } from "@/src/prisma/db";

export async function listarServicios() {
  return db.orm.public.Servicios.select("id", "nombre", "descripcion", "precioReferencial", "activo")
    .orderBy((servicio) => servicio.nombre.asc())
    .all();
}

export type ServicioListado = Awaited<ReturnType<typeof listarServicios>>[number];
