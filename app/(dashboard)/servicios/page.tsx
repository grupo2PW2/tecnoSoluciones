import { ServiceManagement } from "@/components/service-management";
import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export default async function ServicioPage() {
  const currentUser = await requireUser();

  if (currentUser.rol !== "ADMINISTRADOR" && currentUser.rol !== "RECEPCIONISTA") {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">Gestión de servicios</h1>
        <p className="text-sm text-muted-foreground">
          Solo recepción y administración pueden gestionar servicios.
        </p>
      </div>
    );
  }

  const services = await db.orm.public.Servicios
    .select("id", "nombre", "descripcion", "precioReferencial", "activo")
    .all();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">Gestión de servicios</h1>
        <p className="text-sm text-muted-foreground">
          Administra el catálogo de servicios y sus precios de referencia.
        </p>
      </div>
      <ServiceManagement services={services} />
    </div>
  );
}
