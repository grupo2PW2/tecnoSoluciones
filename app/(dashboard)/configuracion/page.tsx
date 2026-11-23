import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { GananciaGlobal } from "@/features/configuracion/components/ganancia-global";
import { consultarConfiguracionGanancia } from "@/features/configuracion/consultas";

async function ConfiguracionAutorizada() {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/login");
  if (usuario.rol !== "ADMINISTRADOR") {
    return <p role="alert" className="p-6">Tu usuario no tiene permiso para administrar la configuración.</p>;
  }

  await connection();
  const estado = await consultarConfiguracionGanancia()
    .then((configuracion) => ({
      margen: configuracion?.margenGanancia ?? "0.00",
      actualizadoEn: configuracion?.updatedAt.toISOString() ?? null,
    }))
    .catch((error: unknown) => {
      console.error("Error al consultar la configuración:", error);
      return null;
    });
  if (!estado) return <p role="alert" className="p-6">No se pudo consultar la configuración. Actualiza la página para reintentar.</p>;

  return (
    <section className="mx-auto max-w-3xl space-y-5 px-4 py-6 md:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Configuración</h1>
      <GananciaGlobal margen={estado.margen} actualizadoEn={estado.actualizadoEn} />
    </section>
  );
}

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={<p role="status" className="p-6">Cargando configuración…</p>}>
      <ConfiguracionAutorizada />
    </Suspense>
  );
}
