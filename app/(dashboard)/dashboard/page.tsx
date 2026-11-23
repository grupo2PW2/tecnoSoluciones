import { Suspense } from "react";
import { DashboardRol } from "@/features/panel/components/dashboard-rol";
import { requireUser } from "@/lib/auth";

async function InicioAutorizado() {
  const { id, rol } = await requireUser();

  return <section className="mx-auto max-w-6xl space-y-5 px-4 py-6 md:px-8">
    <h1 className="text-2xl font-semibold tracking-tight">Inicio</h1>
    <DashboardRol rol={rol} id={id} />
  </section>;
}

export default function InicioPage() {
  return <Suspense fallback={<p role="status" className="p-6">Cargando inicio…</p>}><InicioAutorizado /></Suspense>;
}
