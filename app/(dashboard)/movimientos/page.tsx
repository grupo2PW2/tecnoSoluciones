import { MovementManagement } from "@/components/movement-management";
import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export default async function MovimientoPage() {
  const currentUser = await requireUser();

  if (currentUser.rol !== "ADMINISTRADOR" && currentUser.rol !== "RECEPCIONISTA") {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">Gestión de movimientos</h1>
        <p className="text-sm text-muted-foreground">
          Solo recepción y administración pueden registrar movimientos.
        </p>
      </div>
    );
  }

  const [parts, details] = await Promise.all([
    db.orm.public.Repuestos.select("id", "sku", "nombre", "costoActual").all(),
    db.orm.public.DetalleMovimientos
      .select("id", "cantidad", "costoUnitario")
      .include("repuesto", (repuesto) => repuesto.select("sku", "nombre"))
      .include("movimiento", (movimiento) =>
        movimiento.select("tipo", "fecha", "observaciones"),
      )
      .all(),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">Gestión de movimientos</h1>
        <p className="text-sm text-muted-foreground">
          Registra entradas y ajustes manteniendo sincronizados el stock y su historial.
        </p>
      </div>
      <MovementManagement parts={parts} details={details} />
    </div>
  );
}
