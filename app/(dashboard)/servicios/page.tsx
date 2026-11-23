
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CatalogoServicios } from "@/features/servicios/components/catalogo-servicios";
import { listarServicios } from "@/features/servicios/consultas";
import { getCurrentUser } from "@/lib/auth";

async function ServiciosAutorizados() {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "ADMINISTRADOR") return <p role="alert" className="p-6">Tu usuario no tiene permiso para administrar servicios.</p>;

  await connection();
  const servicios = await listarServicios().catch((error: unknown) => {
    console.error("Error al consultar el catálogo de servicios:", error);
    return null;
  });
  if (!servicios) return <p role="alert" className="p-6">No se pudo consultar el catálogo. Actualiza la página para reintentar.</p>;
  return <CatalogoServicios servicios={servicios} />;
}

export default function ServicioPage() {
  return <Suspense fallback={<p role="status" className="p-6">Cargando servicios…</p>}>
    <ServiciosAutorizados />
  </Suspense>;
}
