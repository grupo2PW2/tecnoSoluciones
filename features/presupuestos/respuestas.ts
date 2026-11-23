
import "server-only";

import { db } from "@/src/prisma/db";
import type { DecisionPresupuesto, OrigenRespuesta } from "./respuesta-modelo";
import { marcarOfertaVencida } from "./vencimiento";

export async function aplicarRespuesta(
  tx: Pick<typeof db, "orm">, ordenId: number, presupuestoId: number, decision: DecisionPresupuesto,
  canal: OrigenRespuesta["canal"], ahora: Date,
) {
  const aprobada = decision === "APROBAR";
  const estado = aprobada ? "APROBADO" : "RECHAZADO";
  await tx.orm.public.Presupuestos.where({ id: presupuestoId }).update({
    estado,
    fechaRespuesta: ahora,
    canalRespuesta: canal,
  });

  if (aprobada) {
    await tx.orm.public.PresupuestoServicio.where({ presupuestoId, estado: "PRESUPUESTADO" })
      .updateAll({ estado: "PENDIENTE_EJECUCION" });
  }

  await tx.orm.public.Orden.where({ id: ordenId }).update({
    estado,
    ...(aprobada ? {} : { fechaCierreTecnico: ahora }),
  });
}

export async function guardarRespuestaPresupuesto(
  origen: OrigenRespuesta, presupuestoId: number, decision: DecisionPresupuesto,
): Promise<{ guardada: true } | { error: string }> {
  return db.transaction(async (tx) => {
    // Usa el mismo orden de bloqueo que la presentación. La respuesta y la versión se guardan juntas.
    const filtro = origen.canal === "WEB" ? { codigoCliente: origen.codigoCliente } : { id: origen.ordenId };
    const orden = await tx.orm.public.Orden.where(filtro)
      .select("id", "estado", "fechaCierreTecnico", "tipoIngreso").forNoKeyUpdate().first();
    if (!orden) return { error: "No se encontró la orden de este presupuesto." };
    const servicioDirecto = orden.tipoIngreso === "SERVICIO_DIRECTO";
    if (servicioDirecto && origen.canal === "WEB") {
      return { error: "La respuesta a un servicio directo se registra en tienda." };
    }
    if (!servicioDirecto && origen.canal === "EN_TIENDA" && decision === "APROBAR") {
      return { error: "El cliente debe aprobar desde el enlace del ticket." };
    }

    const presupuesto = await tx.orm.public.Presupuestos.where({ ordenId: orden.id, tipo: "PRINCIPAL" })
      .select("id", "estado", "fechaVencimiento", "fechaPresentacion", "fechaRespuesta", "total")
      .orderBy((actual) => actual.version.desc()).forNoKeyUpdate().first();
    if (!presupuesto || presupuesto.id !== presupuestoId) {
      return { error: "La versión del presupuesto cambió. Revisa la oferta actual." };
    }

    if (presupuesto.estado === "APROBADO" || presupuesto.estado === "RECHAZADO" || presupuesto.fechaRespuesta) {
      return { error: "Ya se registró una respuesta para esta versión." };
    }

    const ahora = new Date();
    if (presupuesto.estado === "VENCIDO" || (presupuesto.estado === "PENDIENTE_APROBACION" &&
      presupuesto.fechaVencimiento && presupuesto.fechaVencimiento <= ahora)) {
      if (presupuesto.estado !== "VENCIDO") await marcarOfertaVencida(tx, presupuesto.id, ahora);
      return { error: "La oferta venció y ya no admite respuestas." };
    }

    if (orden.estado === "PENDIENTE_APROBACION" && presupuesto.estado === "CANCELADO" && presupuesto.fechaPresentacion) {
      return { error: "La oferta fue retirada. Podrás responder cuando se publique la nueva versión." };
    }

    if (orden.estado !== "PENDIENTE_APROBACION" || orden.fechaCierreTecnico ||
      presupuesto.estado !== "PENDIENTE_APROBACION" || !presupuesto.fechaPresentacion ||
      !presupuesto.fechaVencimiento || presupuesto.total === null) {
      return { error: "Esta versión no está disponible para responder." };
    }

    await aplicarRespuesta(tx, orden.id, presupuesto.id, decision, origen.canal, ahora);
    return { guardada: true };
  });
}
