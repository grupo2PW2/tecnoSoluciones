import { BudgetManagement } from "@/components/budget-management";
import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export default async function PresupuestosPage() {
  const user = await requireUser();

  if (user.rol !== "ADMINISTRADOR" && user.rol !== "TECNICO") {
    return <div className="p-4">Solo técnicos y administradores pueden gestionar presupuestos.</div>;
  }

  const [orders, services, parts, budgets] = await Promise.all([
    db.orm.public.Orden
      .where(user.rol === "TECNICO" ? { tecnicoId: user.id, estado: "DIAGNOSTICADO" } : { estado: "DIAGNOSTICADO" })
      .select("id", "codigo", "diagnostico")
      .all(),
    db.orm.public.Servicios.where({ activo: true }).select("id", "nombre", "precioReferencial").all(),
    db.orm.public.Repuestos.where({ estado: "DISPONIBLE" }).select("id", "sku", "nombre", "precioReferencial").all(),
    db.orm.public.Presupuestos.select("id", "ordenId", "version", "estado").include("orden", (orden) => orden.select("codigo")).all(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div><h1 className="text-xl font-semibold">Gestión de presupuestos</h1><p className="text-sm text-muted-foreground">Crea versiones y espera la decisión del cliente.</p></div>
      <BudgetManagement orders={orders} services={services} parts={parts} budgets={budgets} />
    </div>
  );
}