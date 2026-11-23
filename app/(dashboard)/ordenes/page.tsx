
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BandejaOrdenes } from "@/features/ordenes/components/bandeja-ordenes";
import { BandejaTecnica } from "@/features/ordenes/components/bandeja-tecnica";
import { puedeConsultarOrdenes, puedeRegistrarIngreso, puedeTomarOrdenes } from "@/features/ordenes/modelo";
import { getCurrentUser } from "@/lib/auth";

interface Props {
  searchParams: Promise<{ vista?: string | string[] }>;
}

async function OrdenesAutorizadas({ searchParams }: Props) {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/login");
  if (puedeTomarOrdenes(usuario.rol)) {
    const { vista } = await searchParams;
    const vistaInicial = vista === "mis-ordenes" ? "mis-ordenes" : "disponibles";
    return <BandejaTecnica key={usuario.id + ":" + vistaInicial} tecnicoId={usuario.id} vistaInicial={vistaInicial} />;
  }
  if (!puedeConsultarOrdenes(usuario.rol)) {
    return <p role="alert" className="p-6">Tu usuario no tiene permiso para consultar esta bandeja.</p>;
  }

  return <BandejaOrdenes puedeRegistrar={puedeRegistrarIngreso(usuario.rol)} />;
}

export default function OrdenesPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<p className="p-6">Cargando órdenes…</p>}>
      <OrdenesAutorizadas searchParams={searchParams} />
    </Suspense>
  );
}
