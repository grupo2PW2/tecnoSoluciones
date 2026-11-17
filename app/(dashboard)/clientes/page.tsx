import { ClientManagement } from "@/components/client-management";
import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export default async function ClientePage() {
  const currentUser = await requireUser();

  if (currentUser.rol !== "ADMINISTRADOR" && currentUser.rol !== "RECEPCIONISTA") {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">Gestión de clientes</h1>
        <p className="text-sm text-muted-foreground">
          Solo recepción y administración pueden gestionar clientes.
        </p>
      </div>
    );
  }

  const clients = await db.orm.public.Clientes
    .select("id", "nombre", "ciudad", "direccion")
    .include("contactos", (contactos) =>
      contactos.select("id", "tipo", "valor", "principal"),
    )
    .all();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">Gestión de clientes</h1>
        <p className="text-sm text-muted-foreground">
          Administra clientes y sus medios de contacto.
        </p>
      </div>
      <ClientManagement clients={clients} />
    </div>
  );
}
