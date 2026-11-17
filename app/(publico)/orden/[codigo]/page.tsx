import { headers } from "next/headers";
import { notFound } from "next/navigation";

import { BudgetDecision } from "@/components/budget-decision";
import { db } from "@/src/prisma/db";

const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const attemptWindowMs = 10 * 60 * 1000;
const maxFailedAttempts = 10;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getRequestKey() {
  const requestHeaders = await headers();
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    requestHeaders.get("x-real-ip") ??
    "unknown"
  );
}

function canAttempt(key: string) {
  const currentTime = Date.now();
  const attempt = failedAttempts.get(key);

  if (!attempt || attempt.resetAt <= currentTime) {
    failedAttempts.set(key, { count: 0, resetAt: currentTime + attemptWindowMs });
    return true;
  }

  return attempt.count < maxFailedAttempts;
}

function registerFailedAttempt(key: string) {
  const attempt = failedAttempts.get(key);

  if (attempt) {
    attempt.count += 1;
  }
}

export default async function CodigoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;

  if (!isUuid(codigo)) {
    notFound();
  }

  const requestKey = await getRequestKey();

  if (!canAttempt(requestKey)) {
    notFound();
  }

  const order = await db.orm.public.Orden
    .where({ codigoCliente: codigo })
    .select(
      "id",
      "estado",
      "prioridad",
      "fechaIngreso",
      "fechaEstimada",
      "problemasReportados",
    )
    .include("dispositivo", (dispositivo) => dispositivo.select("tipo", "marca", "modelo"))
    .include("servicio", (servicio) => servicio.select("nombre"))
    .first();

  if (!order) {
    registerFailedAttempt(requestKey);
    notFound();
  }

  const pendingBudget = await db.orm.public.Presupuestos
    .where({ ordenId: order.id, estado: "PENDIENTE_APROBACION" })
    .orderBy((budget) => budget.version.desc())
    .include("detallePresupuesto", (detail) =>
      detail
        .select("id", "cantidad", "precioUnitario", "descripcion")
        .include("servicio", (service) => service.select("nombre"))
        .include("repuesto", (part) => part.select("nombre", "sku")),
    )
    .first();

  const statusLabels: Record<string, string> = {
    RECIBIDO: "Recibido",
    EN_PROCESO: "En proceso",
    DIAGNOSTICADO: "Diagnosticado",
    PENDIENTE_APROBACION: "Pendiente de aprobación",
    RECHAZADO: "Rechazado",
    EN_REPARACION: "En reparación",
    LISTO_PARA_ENTREGA: "Listo para entrega",
    ENTREGADO: "Entregado",
  };

  return (
    <div className="min-h-svh bg-muted/30 px-4 py-10">
      <main className="mx-auto grid max-w-2xl gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Consulta de servicio técnico</p>
          <h1 className="text-2xl font-semibold">Estado de tu orden</h1>
        </div>
        <section className="grid gap-4 rounded-xl bg-card p-6 text-card-foreground ring-1 ring-foreground/10">
          <div>
            <p className="text-sm text-muted-foreground">Estado actual</p>
            <p className="text-xl font-semibold">{statusLabels[order.estado] ?? order.estado}</p>
          </div>
          <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground">Equipo</p>
              <p>{order.dispositivo.marca} {order.dispositivo.modelo}</p>
              <p className="text-sm text-muted-foreground">{order.dispositivo.tipo}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Servicio solicitado</p>
              <p>{order.servicio?.nombre ?? "Servicio técnico"}</p>
              <p className="text-sm text-muted-foreground">Prioridad: {order.prioridad}</p>
            </div>
          </div>
          <div className="grid gap-2 border-t pt-4">
            <p className="text-sm text-muted-foreground">Problema reportado</p>
            <p>{order.problemasReportados}</p>
          </div>
          <div className="grid gap-2 border-t pt-4 text-sm">
            <p>Recepción: {order.fechaIngreso.toLocaleDateString("es-ES")}</p>
            {order.fechaEstimada ? (
              <p>Fecha estimada: {order.fechaEstimada.toLocaleDateString("es-ES")}</p>
            ) : null}
          </div>
        </section>
        {pendingBudget ? <BudgetDecision budget={pendingBudget} codigoCliente={codigo} /> : null}
      </main>
    </div>
  );
}
