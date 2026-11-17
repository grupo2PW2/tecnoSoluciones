import { PartManagement } from "@/components/part-management";
import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export default async function RepuestoPage() {
  const currentUser = await requireUser();

  if (currentUser.rol !== "ADMINISTRADOR" && currentUser.rol !== "RECEPCIONISTA") {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">Gestión de repuestos</h1>
        <p className="text-sm text-muted-foreground">
          Solo recepción y administración pueden gestionar repuestos.
        </p>
      </div>
    );
  }

  const parts = await db.orm.public.Repuestos
    .select(
      "id",
      "sku",
      "nombre",
      "unidadesCaja",
      "imgUrl",
      "precioReferencial",
      "costoActual",
      "estado",
    )
    .all();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">Gestión de repuestos</h1>
        <p className="text-sm text-muted-foreground">
          Administra el catálogo antes de registrar entradas y salidas de inventario.
        </p>
      </div>
      <PartManagement parts={parts} />
    </div>
  );
}
