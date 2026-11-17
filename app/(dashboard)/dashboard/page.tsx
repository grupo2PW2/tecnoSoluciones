import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

const statusLabels: Record<string, string> = {
  RECIBIDO: "Recibidas",
  EN_PROCESO: "En proceso",
  DIAGNOSTICADO: "Diagnosticadas",
  PENDIENTE_APROBACION: "Pendientes de aprobación",
  RECHAZADO: "Rechazadas",
  EN_REPARACION: "En reparación",
  LISTO_PARA_ENTREGA: "Listas para entrega",
  ENTREGADO: "Entregadas",
};

const roleLabels: Record<string, string> = {
  ADMINISTRADOR: "Administrador",
  TECNICO: "Técnico",
  RECEPCIONISTA: "Recepción",
  GERENTE: "Gerente",
};

export default async function PanelPage() {
  await requireUser();

  const [clients, devices, orders, services, inventory, technicians] =
    await Promise.all([
      db.orm.public.Clientes.select("id").all(),
      db.orm.public.Dispositivos.select("id").all(),
      db.orm.public.Orden.select(
        "id",
        "estado",
        "estadoPago",
        "tecnicoId",
        "trabajoVerficado",
      ).all(),
      db.orm.public.Servicios.where({ activo: true }).select("id").all(),
      db.orm.public.Inventario.include("repuesto", (repuesto) =>
        repuesto.select("sku", "nombre"),
      ).all(),
      db.orm.public.Usuarios.where({ rol: "TECNICO", activo: true })
        .select("id", "nombre", "rol")
        .all(),
    ]);
  const statusCounts = orders.reduce<Record<string, number>>(
    (counts, order) => {
      counts[order.estado] = (counts[order.estado] ?? 0) + 1;
      return counts;
    },
    {},
  );
  const lowStock = inventory.filter((item) => item.stock <= item.stockMinimo);
  const pendingPayments = orders.filter(
    (order) =>
      order.estado === "LISTO_PARA_ENTREGA" && order.estadoPago === "PENDIENTE",
  ).length;
  const activeTechnicalOrders = technicians.map((technician) => ({
    ...technician,
    count: orders.filter(
      (order) =>
        order.tecnicoId === technician.id &&
        order.estado !== "ENTREGADO" &&
        !(order.estado === "LISTO_PARA_ENTREGA" && order.trabajoVerficado),
    ).length,
  }));

  return (
    <div className="flex flex-1 flex-col gap-6 p-4">
      <div>
        <h1 className="text-xl font-semibold">Panel de control</h1>
        <p className="text-sm text-muted-foreground">
          Resumen operativo de Tecno Soluciones.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Clientes" value={clients.length} />
        <MetricCard title="Dispositivos" value={devices.length} />
        <MetricCard title="Órdenes" value={orders.length} />
        <MetricCard title="Servicios activos" value={services.length} />
        <MetricCard
          title="Pagos pendientes"
          value={pendingPayments}
          alert={pendingPayments > 0}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Estado de órdenes</CardTitle>
            <CardDescription>Distribución actual del trabajo.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {Object.entries(statusLabels).map(([status, label]) => (
              <div
                key={status}
                className="flex justify-between border-b py-2 last:border-0"
              >
                <span>{label}</span>
                <span className="font-semibold">
                  {statusCounts[status] ?? 0}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Alertas de inventario</CardTitle>
            <CardDescription>
              Repuestos en el mínimo o por debajo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            {lowStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay alertas de stock.
              </p>
            ) : (
              lowStock.map((item) => (
                <div
                  key={item.repuestoId}
                  className="flex justify-between border-b py-2 last:border-0"
                >
                  <span>
                    {item.repuesto.nombre}{" "}
                    <span className="text-muted-foreground">
                      ({item.repuesto.sku})
                    </span>
                  </span>
                  <span className="font-semibold text-destructive">
                    {item.stock} / {item.stockMinimo}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Capacidad técnica</CardTitle>
            <CardDescription>
              Órdenes técnicas activas por técnico.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {activeTechnicalOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay técnicos activos.
              </p>
            ) : (
              activeTechnicalOrders.map((technician) => (
                <div key={technician.id} className="rounded-lg border p-3">
                  <p className="font-medium">{technician.nombre}</p>
                  <p
                    className={`text-sm ${technician.count >= 2 ? "text-destructive" : "text-muted-foreground"}`}
                  >
                    {technician.count} / 2 órdenes activas
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {roleLabels[technician.rol]}
                  </p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  alert = false,
}: {
  title: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{title}</CardDescription>
        <CardTitle className={alert ? "text-destructive" : "text-2xl"}>
          {value}
        </CardTitle>
      </CardHeader>
    </Card>
  );
}
