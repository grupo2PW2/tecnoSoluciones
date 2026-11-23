
import "server-only";

import { db } from "@/src/prisma/db";
import { textoCliente, textoEquipo } from "./modelo";
import { buscarLineaDiagnostico } from "./diagnostico";
import { nombreDiagnosticoGeneral } from "./diagnostico-general";

export async function obtenerDetalleTecnico(ordenId: number, tecnicoId: number) {
  const orden = await db.orm.public.Orden.where({ id: ordenId, tecnicoId })
    .select("id", "codigo", "estado", "tipoIngreso", "fechaIngreso", "fechaCierreTecnico",
      "problemasReportados", "condicionDispositivo", "accesoriosRecibidos", "motivoCancelacion")
    .include("dispositivo", (equipo) => equipo.select("marca", "modelo", "nroSerie")
      .include("cliente", (cliente) => cliente.select("nombre", "apellido")))
    .first();
  if (!orden) return null;

  const diagnostico = await buscarLineaDiagnostico(db, ordenId);
  const servicioDiagnostico = orden.tipoIngreso === "DIAGNOSTICO" && !diagnostico
    ? await db.orm.public.Servicios.where({ nombre: nombreDiagnosticoGeneral, activo: true })
        .select("precioReferencial").first()
    : null;

  const { dispositivo, ...datos } = orden;
  return {
    ...datos,
    diagnostico,
    tarifaDiagnostico: diagnostico?.precioUnitario ?? servicioDiagnostico?.precioReferencial ?? null,
    equipo: dispositivo ? textoEquipo(dispositivo) : "Equipo no disponible",
    serie: dispositivo?.nroSerie ?? null,
    cliente: dispositivo?.cliente ? textoCliente(dispositivo.cliente) : "Cliente no disponible",
  };
}

export type DatosDetalleTecnico = NonNullable<Awaited<ReturnType<typeof obtenerDetalleTecnico>>>;
