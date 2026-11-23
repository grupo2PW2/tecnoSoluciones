import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DispositivosListado } from "@/features/dispositivos/components/dispositivos-listado";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { getCurrentUser } from "@/lib/auth";

async function DispositivosAutorizados() {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/login");
  if (!puedeRegistrarIngreso(usuario.rol)) {
    return <p role="alert" className="p-6">Tu usuario no tiene permiso para gestionar dispositivos.</p>;
  }
  return <DispositivosListado />;
}

export default function DispositivosPage() {
  return <Suspense fallback={<p role="status" className="p-6">Cargando dispositivos…</p>}>
    <DispositivosAutorizados />
  </Suspense>;
}
