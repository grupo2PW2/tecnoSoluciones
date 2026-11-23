import { Suspense } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { consultarGananciaSobreCosto } from "@/features/configuracion/consultas";
import { listarRepuestos } from "@/features/inventario/consultas";
import { listarMovimientos } from "@/features/movimientos/consultas";
import { Movimientos } from "@/features/movimientos/components/movimientos";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";

async function MovimientosAutorizados() {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/login");
  if (!puedeRegistrarIngreso(usuario.rol)) {
    return <p role="alert" className="p-6">Tu usuario no tiene permiso para consultar ni registrar movimientos.</p>;
  }

  await connection();
  const datos = await Promise.all([listarMovimientos(), listarRepuestos(), consultarGananciaSobreCosto()]).catch((error: unknown) => {
    console.error("Error al consultar movimientos:", error);
    return null;
  });
  if (!datos) return <p role="alert" className="p-6">No se pudieron consultar los movimientos. Actualiza la página para reintentar.</p>;

  const [movimientos, repuestos, margenGanancia] = datos;
  return <Movimientos movimientos={movimientos} repuestos={repuestos} margenGanancia={margenGanancia} />;
}

export default function MovimientosPage() {
  return (
    <Suspense fallback={<p role="status" className="p-6">Cargando movimientos…</p>}>
      <MovimientosAutorizados />
    </Suspense>
  );
}
