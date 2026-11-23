import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { listarRepuestos } from "@/features/inventario/consultas";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { CatalogoRepuestos } from "@/features/repuestos/components/catalogo-repuestos";
import { getCurrentUser } from "@/lib/auth";

async function RepuestosAutorizados() {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/login");
  if (!puedeRegistrarIngreso(usuario.rol)) {
    return <p role="alert" className="p-6">Tu usuario no tiene permiso para gestionar repuestos.</p>;
  }

  await connection();
  const repuestos = await listarRepuestos().catch((error: unknown) => {
    console.error("Error al consultar el catálogo de repuestos:", error);
    return null;
  });
  if (!repuestos) return <p role="alert" className="p-6">No se pudo consultar el catálogo. Actualiza la página para reintentar.</p>;

  return <CatalogoRepuestos repuestos={repuestos} />;
}

export default function RepuestosPage() {
  return (
    <Suspense fallback={<p role="status" className="p-6">Cargando repuestos…</p>}>
      <RepuestosAutorizados />
    </Suspense>
  );
}
