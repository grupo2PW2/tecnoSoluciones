import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { CatalogoUsuarios } from "@/features/usuarios/components/catalogo-usuarios";
import { listarUsuarios } from "@/features/usuarios/consultas";
import { getCurrentUser } from "@/lib/auth";

async function UsuariosAutorizados() {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "ADMINISTRADOR") {
    return <p role="alert" className="p-6">Solo Administración puede gestionar usuarios.</p>;
  }
  await connection();
  const usuarios = await listarUsuarios().catch((error: unknown) => {
    console.error("Error al consultar usuarios:", error);
    return null;
  });
  if (!usuarios) return <p role="alert" className="p-6">No se pudo consultar el catálogo. Actualiza la página para reintentar.</p>;
  return <CatalogoUsuarios usuarios={usuarios} administradorId={usuario.id} />;
}

export default function UsuariosPage() {
  return <Suspense fallback={<p role="status" className="p-6">Cargando usuarios…</p>}>
    <UsuariosAutorizados />
  </Suspense>;
}
