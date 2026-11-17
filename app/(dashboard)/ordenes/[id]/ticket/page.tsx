import Link from "next/link";
import { notFound } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { PrintTicketButton } from "@/components/print-ticket-button";
import { requireUser } from "@/lib/auth";
import { cn } from "cn";
import { db } from "@/src/prisma/db";

export default async function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();

  if (user.rol !== "ADMINISTRADOR" && user.rol !== "RECEPCIONISTA") {
    notFound();
  }

  const { id: idValue } = await params;
  const id = Number(idValue);

  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }

  const order = await db.orm.public.Orden
    .where({ id })
    .select("id", "codigo", "codigoCliente", "fechaIngreso", "problemasReportados", "prioridad", "fechaEstimada")
    .include("dispositivo", (dispositivo) => dispositivo.select("tipo", "marca", "modelo").include("cliente", (cliente) => cliente.select("nombre", "ciudad")))
    .include("servicio", (servicio) => servicio.select("nombre"))
    .first();

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-svh bg-muted/30 p-6">
      <div className="mx-auto grid max-w-xl gap-4">
        <div className="flex gap-2 print:hidden">
          <Link href="/ordenes" className={cn(buttonVariants({ variant: "outline" }))}>Volver</Link>
          <PrintTicketButton />
        </div>
        <section className="grid gap-5 bg-background p-8 text-foreground shadow-sm print:shadow-none">
          <header className="border-b pb-4 text-center">
            <p className="text-sm text-muted-foreground">Tecno Soluciones</p>
            <h1 className="text-2xl font-semibold">Ticket de recepción</h1>
            <p className="mt-2 text-lg font-medium">{order.codigo}</p>
          </header>
          <div className="grid gap-2 text-sm">
            <p><strong>Cliente:</strong> {order.dispositivo.cliente.nombre}</p>
            <p><strong>Ciudad:</strong> {order.dispositivo.cliente.ciudad}</p>
            <p><strong>Equipo:</strong> {order.dispositivo.marca} {order.dispositivo.modelo} ({order.dispositivo.tipo})</p>
            <p><strong>Servicio:</strong> {order.servicio?.nombre ?? "Servicio técnico"}</p>
            <p><strong>Prioridad:</strong> {order.prioridad}</p>
            <p><strong>Fecha de recepción:</strong> {order.fechaIngreso.toLocaleDateString("es-ES")}</p>
            {order.fechaEstimada ? <p><strong>Fecha estimada:</strong> {order.fechaEstimada.toLocaleDateString("es-ES")}</p> : null}
            <p><strong>Problema reportado:</strong> {order.problemasReportados}</p>
          </div>
          <div className="border-t pt-4 text-center">
            <p className="text-sm text-muted-foreground">Código privado de consulta</p>
            <p className="break-all font-mono text-sm">{order.codigoCliente}</p>
            <p className="mt-2 text-xs text-muted-foreground">Consulta: /orden/{order.codigoCliente}</p>
          </div>
        </section>
      </div>
    </main>
  );
}