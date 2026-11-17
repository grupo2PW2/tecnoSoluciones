import { InventoryManagement } from "@/components/inventory-management";
import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export default async function IventarioPage() {
  const currentUser = await requireUser();

  if (currentUser.rol !== "ADMINISTRADOR" && currentUser.rol !== "RECEPCIONISTA") {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">Gestión de inventario</h1>
        <p className="text-sm text-muted-foreground">
          Solo recepción y administración pueden gestionar inventario.
        </p>
      </div>
    );
  }

  const parts = await db.orm.public.Repuestos
    .select("id", "sku", "nombre")
    .include("inventario", (inventario) => inventario.select("stock", "stockMinimo"))
    .all();
  const items = parts.map((part) => ({
    repuestoId: part.id,
    sku: part.sku,
    nombre: part.nombre,
    stock: part.inventario[0]?.stock ?? 0,
    stockMinimo: part.inventario[0]?.stockMinimo ?? 0,
  }));

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">Gestión de inventario</h1>
        <p className="text-sm text-muted-foreground">
          Consulta existencias y define niveles mínimos de reposición.
        </p>
      </div>
      <InventoryManagement items={items} />
    </div>
  );
}
