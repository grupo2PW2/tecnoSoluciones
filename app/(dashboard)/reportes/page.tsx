import { Suspense } from "react";
import { Reportes } from "@/features/reportes/components/reportes";
import { periodoInicialReporte } from "@/features/reportes/filtros";
import { puedeConsultarReportes } from "@/features/reportes/modelo";
import { requireUser } from "@/lib/auth";

async function ReportesAutorizados() {
  const usuario = await requireUser();
  if (!puedeConsultarReportes(usuario.rol)) {
    return <p role="alert" className="p-6">Tu usuario no tiene permiso para consultar reportes.</p>;
  }

  return <Reportes periodoInicial={periodoInicialReporte()} />;
}

export default function ReportesPage() {
  return <Suspense fallback={<p role="status" className="p-6">Cargando reportes…</p>}>
    <ReportesAutorizados />
  </Suspense>;
}
