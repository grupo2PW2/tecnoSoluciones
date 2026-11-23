import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Inventario } from "@/features/inventario/components/inventario";
import { listarRepuestos } from "@/features/inventario/consultas";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { getCurrentUser } from "@/lib/auth";

async function InventarioAutorizado() {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/login");
  if (!puedeRegistrarIngreso(usuario.rol)) {
    return <p role="alert" className="p-6">Tu usuario no tiene permiso para gestionar inventario.</p>;
  }

  await connection();
  const repuestos = await listarRepuestos().catch((error: unknown) => {
    console.error("Error al consultar inventario:", error);
    return null;
  });
  if (!repuestos) return <p role="alert" className="p-6">No se pudo consultar el inventario. Actualiza la página para reintentar.</p>;

  return <Inventario repuestos={repuestos} />;
}

export default function InventarioPage() {
  return (
    <Suspense fallback={<p role="status" className="p-6">Cargando inventario…</p>}>
      <InventarioAutorizado />
    </Suspense>
  );
}
