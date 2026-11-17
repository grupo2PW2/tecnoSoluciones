import { DiagnosticManagement } from "@/components/diagnostic-management";
import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export default async function DiagnosticoPage() {
  const currentUser = await requireUser();

  if (currentUser.rol !== "TECNICO" && currentUser.rol !== "ADMINISTRADOR") {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">Gestión de diagnósticos</h1>
        <p className="text-sm text-muted-foreground">
          Solo técnicos y administradores pueden gestionar diagnósticos.
        </p>
      </div>
    );
  }

  const orderFields = ["id", "codigo", "diagnostico", "estado", "trabajoVerficado"] as const;
  const deviceInclude = (dispositivo: typeof db.orm.public.Dispositivos) =>
    dispositivo.select("marca", "modelo").include("cliente", (cliente) => cliente.select("nombre"));
  const serviceInclude = (servicio: typeof db.orm.public.Servicios) =>
    servicio.select("id", "nombre", "precioReferencial");
  const activityInclude = (actividad: typeof db.orm.public.Actividades) =>
    actividad
      .select("id", "observaciones", "precioUnitario", "estado")
      .include("servicio", (servicio) => servicio.select("nombre"));
  const [availableOrders, assignedOrders, parts] = await Promise.all([
    currentUser.rol === "TECNICO"
      ? db.orm.public.Orden
          .where({ tecnicoId: null })
          .select(...orderFields)
          .include("dispositivo", deviceInclude)
          .include("servicio", serviceInclude)
          .include("actividades", activityInclude)
          .all()
      : [],
    currentUser.rol === "TECNICO"
      ? db.orm.public.Orden
          .where({ tecnicoId: currentUser.id })
          .select(...orderFields)
          .include("dispositivo", deviceInclude)
          .include("servicio", serviceInclude)
          .include("actividades", activityInclude)
          .all()
      : db.orm.public.Orden
          .select(...orderFields)
          .include("dispositivo", deviceInclude)
          .include("servicio", serviceInclude)
          .include("actividades", activityInclude)
          .all(),
    db.orm.public.Repuestos
      .select("id", "sku", "nombre")
      .include("inventario", (inventario) => inventario.select("stock"))
      .all(),
  ]);
  const partOptions = parts.map((part) => ({
    id: part.id,
    sku: part.sku,
    nombre: part.nombre,
    stock: part.inventario[0]?.stock ?? 0,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">Gestión de diagnósticos</h1>
        <p className="text-sm text-muted-foreground">
          Asigna órdenes y registra el diagnóstico técnico correspondiente.
        </p>
      </div>
      <DiagnosticManagement
        availableOrders={availableOrders}
        assignedOrders={assignedOrders}
        canAssign={currentUser.rol === "TECNICO"}
        parts={partOptions}
      />
    </div>
  );
}
