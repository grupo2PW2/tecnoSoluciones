import { OrderManagement } from "@/components/order-management";
import { OrderPayment } from "@/components/order-payment";
import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export default async function OrdenPage() {
  const currentUser = await requireUser();

  if (currentUser.rol !== "ADMINISTRADOR" && currentUser.rol !== "RECEPCIONISTA") {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">Gestión de órdenes</h1>
        <p className="text-sm text-muted-foreground">
          Solo recepción y administración pueden registrar órdenes.
        </p>
      </div>
    );
  }

  const [clients, devices, services, orders, readyOrders] = await Promise.all([
    db.orm.public.Clientes.select("id", "nombre").all(),
    db.orm.public.Dispositivos.select("id", "clienteId", "tipo", "marca", "modelo").all(),
    db.orm.public.Servicios
      .where({ activo: true })
      .select("id", "nombre", "precioReferencial")
      .all(),
    db.orm.public.Orden
      .select("id", "codigo", "codigoCliente", "problemasReportados", "prioridad", "estado")
      .include("dispositivo", (dispositivo) =>
        dispositivo.select("marca", "modelo").include("cliente", (cliente) => cliente.select("nombre")),
      )
      .include("servicio", (servicio) => servicio.select("nombre"))
      .all(),
    db.orm.public.Orden
      .where({ estado: "LISTO_PARA_ENTREGA" })
      .select("id", "codigo", "descuentoAplicado", "estadoPago")
      .include("dispositivo", (dispositivo) => dispositivo.select("marca", "modelo").include("cliente", (cliente) => cliente.select("nombre")))
      .include("actividades", (actividad) => actividad.select("estado", "precioUnitario"))
      .include("movimientos", (movimiento) => movimiento
        .select("tipo")
        .where({ tipo: "SALIDA_REPARACION" })
        .include("detalleMovimientos", (detalle) => detalle.select("cantidad", "precioUnitario")))
      .all(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">Gestión de órdenes</h1>
        <p className="text-sm text-muted-foreground">
          Registra la recepción de equipos y consulta sus órdenes activas.
        </p>
      </div>
      <OrderManagement clients={clients} devices={devices} services={services} orders={orders} />
      <OrderPayment orders={readyOrders} />
    </div>
  );
}
