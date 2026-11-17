import { connection } from "next/server";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export default async function BuscarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await connection();
  await requireUser();
  const query = ((await searchParams).q ?? "").trim();

  if (!query) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-semibold">Búsqueda</h1>
        <p className="text-sm text-muted-foreground">Escribe un término para buscar.</p>
      </div>
    );
  }

  const pattern = `%${query}%`;
  const [clients, devices, orders] = await Promise.all([
    db.orm.public.Clientes.where((client) => client.nombre.ilike(pattern)).select("id", "nombre", "ciudad").limit(10).all(),
    db.orm.public.Dispositivos.where((device) => device.marca.ilike(pattern).or(device.modelo.ilike(pattern))).select("id", "marca", "modelo", "nroSerie").limit(10).all(),
    db.orm.public.Orden.where((order) => order.codigo.ilike(pattern).or(order.problemasReportados.ilike(pattern))).select("id", "codigo", "estado", "problemasReportados").limit(10).all(),
  ]);

  return (
    <div className="grid gap-6 p-4">
      <div>
        <h1 className="text-xl font-semibold">Resultados de búsqueda</h1>
        <p className="text-sm text-muted-foreground">Coincidencias para “{query}”.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <ResultCard title="Clientes" items={clients.map((client) => `${client.nombre} · ${client.ciudad}`)} />
        <ResultCard title="Dispositivos" items={devices.map((device) => `${device.marca} ${device.modelo}${device.nroSerie ? ` · ${device.nroSerie}` : ""}`)} />
        <ResultCard title="Órdenes" items={orders.map((order) => `${order.codigo} · ${order.estado}`)} />
      </div>
    </div>
  );
}

function ResultCard({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle><CardDescription>{items.length} coincidencias</CardDescription></CardHeader>
      <CardContent className="grid gap-2">
        {items.length === 0 ? <p className="text-sm text-muted-foreground">Sin resultados.</p> : items.map((item) => <p key={item} className="border-b py-2 text-sm last:border-0">{item}</p>)}
      </CardContent>
    </Card>
  );
}