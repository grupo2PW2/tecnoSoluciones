
import "server-only";

import { db } from "@/src/prisma/db";
import { sumarImportesRegistrados } from "@/features/presupuestos/importes";
import { buscarLineaDiagnostico } from "./diagnostico";
import type { CobroEntrega, PartidaCobroEntrega } from "./entrega-modelo";
import type { EstadoOrden } from "./modelo";

interface OrdenParaEntrega {
  id: number;
  estado: EstadoOrden;
  fechaEntregaCliente: Date | null;
  entregadoPorId: number | null;
  montoCobrado: string | null;
}

export async function calcularCobroEntrega(orden: OrdenParaEntrega, tx: Pick<typeof db, "orm"> = db): Promise<CobroEntrega> {
  if (orden.fechaEntregaCliente || orden.estado === "ENTREGADO" || orden.estado === "RECHAZADO_ENTREGADO") {
    return { error: "La entrega de esta orden ya fue registrada." };
  }
  if (orden.entregadoPorId !== null || orden.montoCobrado !== null) {
    return { error: "Hay datos de entrega previos. Revisa el registro de la orden antes de continuar." };
  }

  if (orden.estado === "CANCELADO") {
    return { operacion: "devolucion", estadoFinal: "CANCELADO", monto: null, partidas: [] };
  }

  if (orden.estado === "RECHAZADO") {
    const diagnostico = await buscarLineaDiagnostico(tx, orden.id, true);
    if (!diagnostico) return { operacion: "devolucion", estadoFinal: "RECHAZADO_ENTREGADO", monto: null, partidas: [] };

    const monto = sumarImportesRegistrados([diagnostico.precioUnitario]);
    if (monto === null) return { error: "Revisa la tarifa del diagnóstico antes de registrar la devolución." };

    return {
      operacion: "devolucion",
      estadoFinal: "RECHAZADO_ENTREGADO",
      monto,
      partidas: [{ concepto: "Diagnóstico general", importe: monto }],
    };
  }

  if (orden.estado !== "LISTO") {
    return { error: "La entrega se habilita cuando el equipo está listo o se autoriza su devolución." };
  }

  const presupuestos = await tx.orm.public.Presupuestos.where({ ordenId: orden.id, estado: "APROBADO" })
    .select("tipo", "version", "total").orderBy((presupuesto) => presupuesto.version.asc()).all();
  if (presupuestos.filter((presupuesto) => presupuesto.tipo === "PRINCIPAL").length !== 1) {
    return { error: "Para cobrar debe haber un solo presupuesto principal aprobado." };
  }

  const partidas: PartidaCobroEntrega[] = [];
  for (const presupuesto of presupuestos) {
    if (presupuesto.total === null) {
      return { error: "Falta el total ofrecido de la versión " + presupuesto.version + "." };
    }
    partidas.push({
      concepto: (presupuesto.tipo === "PRINCIPAL" ? "Presupuesto principal" : "Presupuesto adicional") +
        " · Versión " + presupuesto.version,
      importe: presupuesto.total,
    });
  }

  const monto = sumarImportesRegistrados(partidas.map((partida) => partida.importe));
  if (monto === null) return { error: "Revisa los importes aprobados antes de confirmar el cobro." };

  return { operacion: "entrega", estadoFinal: "ENTREGADO", monto, partidas };
}

export async function confirmarEntregaOrden(ordenId: number, usuarioId: number, montoConfirmado: string | null):
Promise<{ registrada: true } | { error: string }> {
  return db.transaction(async (tx) => {
    const orden = await tx.orm.public.Orden.where({ id: ordenId })
      .select("id", "estado", "fechaEntregaCliente", "entregadoPorId", "montoCobrado")
      .forNoKeyUpdate().first();
    if (!orden) return { error: "No se encontró la orden." };

    const cobro = await calcularCobroEntrega(orden, tx);
    if ("error" in cobro) return cobro;
    if (montoConfirmado !== cobro.monto) {
      return { error: "Cambió el importe. Revisa el cobro actualizado antes de confirmar." };
    }

    await tx.orm.public.Orden.where({ id: orden.id }).update({
      estado: cobro.estadoFinal,
      fechaEntregaCliente: new Date(),
      entregadoPorId: usuarioId,
      montoCobrado: cobro.monto,
    });
    return { registrada: true };
  });
}
