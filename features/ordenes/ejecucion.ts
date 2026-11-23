
import "server-only";

import { and } from "@prisma/orm-postgres/orm-client";
import { db } from "@/src/prisma/db";
import { nombreDiagnosticoGeneral } from "./diagnostico-general";
import { puedeEjecutarReparacion, trabajoCompleto, trabajoPuedeIniciar, type TrabajoAutorizado } from "./ejecucion-modelo";
import type { SolicitudEjecucion } from "./ejecucion-schemas";

export async function listarTrabajoAutorizado(ordenId: number, tx: Pick<typeof db, "orm"> = db): Promise<TrabajoAutorizado[]> {
  const partidas = await tx.orm.public.PresupuestoServicio
    .where((partida) => partida.presupuesto.some((presupuesto) => and(
      presupuesto.ordenId.eq(ordenId),
      presupuesto.estado.eq("APROBADO"),
    )))
    .select("presupuestoId", "servicioId", "cantidad", "estado", "fechaInicio", "fechaFinalizacion",
      "observaciones", "trabajoVerificado")
    .include("presupuesto", (presupuesto) => presupuesto.select("version"))
    .include("servicio", (servicio) => servicio.select("nombre"))
    .orderBy([(partida) => partida.presupuesto.version.asc(), (partida) => partida.servicioId.asc()])
    .all();

  return partidas.map(({ presupuesto, servicio, fechaInicio, fechaFinalizacion, ...partida }) => ({
    ...partida,
    version: presupuesto?.version ?? null,
    nombre: servicio?.nombre ?? "Servicio",
    esDiagnostico: servicio?.nombre === nombreDiagnosticoGeneral,
    fechaInicio: fechaInicio?.toISOString() ?? null,
    fechaFinalizacion: fechaFinalizacion?.toISOString() ?? null,
  }));
}

export async function registrarEjecucion(solicitud: SolicitudEjecucion, tecnicoId: number):
Promise<{ guardado: true } | { error: string }> {
  return db.transaction(async (tx) => {
    const orden = await tx.orm.public.Orden.where({ id: solicitud.ordenId, tecnicoId })
      .select("id", "estado", "fechaCierreTecnico").forNoKeyUpdate().first();
    if (!orden) return { error: "La orden no está asignada a tu usuario." };
    if (solicitud.operacion === "listo" && orden.estado === "LISTO" && orden.fechaCierreTecnico) {
      return { guardado: true };
    }
    if (!puedeEjecutarReparacion(orden.estado, orden.fechaCierreTecnico !== null)) {
      return { error: "El estado de la orden no permite registrar trabajo técnico." };
    }

    const autorizadas = await listarTrabajoAutorizado(orden.id, tx);
    if (solicitud.operacion === "listo") {
      if (!autorizadas.length || !autorizadas.every(trabajoCompleto)) {
        return { error: "Finaliza y verifica todos los servicios autorizados antes de marcar la orden como lista." };
      }

      await tx.orm.public.Orden.where({ id: orden.id }).update({ estado: "LISTO", fechaCierreTecnico: new Date() });
      return { guardado: true };
    }

    const trabajo = autorizadas.find((partida) => partida.presupuestoId === solicitud.presupuestoId &&
      partida.servicioId === solicitud.servicioId);
    if (!trabajo || trabajo.esDiagnostico) {
      return { error: "Esta partida no admite cambios de ejecución." };
    }

    const partida = tx.orm.public.PresupuestoServicio.where({
      presupuestoId: trabajo.presupuestoId, servicioId: trabajo.servicioId,
    });

    if (solicitud.operacion === "iniciar") {
      if (trabajo.estado === "EN_PROCESO") return { guardado: true };
      if (!trabajoPuedeIniciar(trabajo)) return { error: "Este servicio ya no puede iniciarse." };

      await partida.update({ estado: "EN_PROCESO", fechaInicio: new Date() });
      if (orden.estado === "APROBADO") {
        await tx.orm.public.Orden.where({ id: orden.id }).update({ estado: "EN_REPARACION" });
      }
      return { guardado: true };
    }

    if (solicitud.operacion === "finalizar" && trabajoCompleto(trabajo) &&
      trabajo.observaciones === solicitud.observaciones) return { guardado: true };
    if (trabajo.estado !== "EN_PROCESO") return { error: "Este servicio ya no está en proceso." };

    await partida.update({
      observaciones: solicitud.observaciones,
      ...(solicitud.operacion === "finalizar" && {
        estado: "FINALIZADO",
        fechaFinalizacion: new Date(),
        trabajoVerificado: true,
      }),
    });
    return { guardado: true };
  });
}
