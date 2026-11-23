
import "server-only";

import { and } from "@prisma/orm-postgres/orm-client";
import { db } from "@/src/prisma/db";
import { nombreDiagnosticoGeneral, type OperacionDiagnostico } from "./diagnostico-general";

export function buscarLineaDiagnostico(tx: Pick<typeof db, "orm">, ordenId: number, soloRealizado = false) {
  const lineas = tx.orm.public.PresupuestoServicio.where((linea) => and(
    linea.presupuesto.some((presupuesto) => and(
      presupuesto.ordenId.eq(ordenId),
      presupuesto.tipo.eq("PRINCIPAL"),
    )),
    linea.servicio.some((servicio) => servicio.nombre.eq(nombreDiagnosticoGeneral)),
  ));
  return (soloRealizado ? lineas.where({ estado: "FINALIZADO" }) : lineas)
    .select("presupuestoId", "servicioId", "precioUnitario", "estado", "fechaInicio", "fechaFinalizacion",
      "observaciones", "trabajoVerificado")
    .include("presupuesto", (presupuesto) => presupuesto.select("estado"))
    .orderBy((linea) => linea.presupuesto.version.desc())
    .first();
}

export type LineaDiagnosticoGeneral = NonNullable<Awaited<ReturnType<typeof buscarLineaDiagnostico>>>;

export async function actualizarDiagnostico(
  ordenId: number, tecnicoId: number, operacion: OperacionDiagnostico, hallazgos: string,
): Promise<{ guardado: true } | { error: string }> {
  return db.transaction(async (tx) => {
    const orden = await tx.orm.public.Orden.where({ id: ordenId, tecnicoId })
      .select("id", "tipoIngreso", "estado", "fechaCierreTecnico").forNoKeyUpdate().first();
    if (!orden) return { error: "La orden no está asignada a tu usuario." };
    if (orden.tipoIngreso !== "DIAGNOSTICO" || orden.fechaCierreTecnico) {
      return { error: "Esta orden no admite cambios en el diagnóstico." };
    }

    const existente = await buscarLineaDiagnostico(tx, ordenId);
    if (operacion === "iniciar") {
      if (orden.estado !== "RECIBIDO" && orden.estado !== "EN_DIAGNOSTICO") {
        return { error: "El estado de la orden ya no permite iniciar un diagnóstico." };
      }
      if (existente?.estado === "EN_PROCESO" && orden.estado === "EN_DIAGNOSTICO") return { guardado: true };
      if (existente && (existente.presupuesto?.estado !== "BORRADOR" ||
        !["PRESUPUESTADO", "PENDIENTE_EJECUCION"].includes(existente.estado))) {
        return { error: "Esta orden ya tiene un diagnóstico registrado." };
      }

      if (existente) {
        await tx.orm.public.PresupuestoServicio.where({
          presupuestoId: existente.presupuestoId, servicioId: existente.servicioId,
        }).update({ estado: "EN_PROCESO", fechaInicio: new Date() });
      } else {
        const error = await registrarLineaDiagnostico(tx, ordenId);
        if (error) return { error };
      }

      await tx.orm.public.Orden.where({ id: ordenId }).update({ estado: "EN_DIAGNOSTICO" });
      return { guardado: true };
    }

    if (!existente || existente.presupuesto?.estado !== "BORRADOR" || orden.estado !== "EN_DIAGNOSTICO") {
      return { error: "La orden ya no tiene un diagnóstico editable." };
    }
    if (operacion === "finalizar" && existente.estado === "FINALIZADO" && existente.observaciones === hallazgos) {
      return { guardado: true };
    }
    if (existente.estado !== "EN_PROCESO") return { error: "El diagnóstico ya no está en proceso." };

    await tx.orm.public.PresupuestoServicio.where({
      presupuestoId: existente.presupuestoId, servicioId: existente.servicioId,
    }).update({
      observaciones: hallazgos,
      ...(operacion === "finalizar" && {
        estado: "FINALIZADO",
        fechaFinalizacion: new Date(),
        trabajoVerificado: true,
      }),
    });
    return { guardado: true };
  });
}

async function registrarLineaDiagnostico(tx: Pick<typeof db, "orm">, ordenId: number) {
  const servicio = await tx.orm.public.Servicios.where({ nombre: nombreDiagnosticoGeneral, activo: true })
    .select("id", "precioReferencial").first();
  if (!servicio) return "El servicio Diagnóstico general no está activo en el catálogo. Avisa a Administración.";

  const principal = await tx.orm.public.Presupuestos.where({ ordenId, tipo: "PRINCIPAL" })
    .select("id", "estado").orderBy((presupuesto) => presupuesto.version.desc()).first();
  if (principal && principal.estado !== "BORRADOR") {
    return "La orden ya tiene una cotización principal presentada.";
  }

  let presupuestoId = principal?.id;
  if (presupuestoId === undefined) {
    const ultimaVersion = await tx.orm.public.Presupuestos.where({ ordenId })
      .select("version").orderBy((presupuesto) => presupuesto.version.desc()).first();
    const borrador = await tx.orm.public.Presupuestos.select("id").create({
      ordenId,
      version: (ultimaVersion?.version ?? 0) + 1,
    });
    presupuestoId = borrador.id;
  }

  await tx.orm.public.PresupuestoServicio.create({
    presupuestoId,
    servicioId: servicio.id,
    cantidad: 1,
    precioUnitario: servicio.precioReferencial,
    estado: "EN_PROCESO",
    fechaInicio: new Date(),
  });
  return null;
}
