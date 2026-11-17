import { UserManagement } from "@/components/user-management";
import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export default async function UsuarioPage() {
  const currentUser = await requireUser();

  if (currentUser.rol !== "ADMINISTRADOR") {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-xl font-semibold">Gestión de usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Solo los administradores pueden gestionar usuarios.
        </p>
      </div>
    );
  }

  const users = await db.orm.public.Usuarios
    .select("id", "nombre", "DNI", "username", "activo", "rol")
    .all();

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div>
        <h1 className="text-xl font-semibold">Gestión de usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Administra las cuentas y los roles del personal.
        </p>
      </div>
      <UserManagement users={users} />
    </div>
  );
}
