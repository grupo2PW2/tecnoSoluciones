import { Suspense } from "react";
import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ClientesListado } from "@/features/clientes/components/clientes-listado";
import { obtenerClientesPaginados } from "@/features/clientes/queries";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { getCurrentUser } from "@/lib/auth";

async function ClientesAutorizados() {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/login");
  if (!puedeRegistrarIngreso(usuario.rol)) {
    return <p role="alert" className="p-6">Tu usuario no tiene permiso para gestionar clientes.</p>;
  }

  await connection();
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["clientes", { buscar: "", page: 1 }],
    queryFn: () => obtenerClientesPaginados({ buscar: "", page: 1, limit: 10 }),
  });
  return <HydrationBoundary state={dehydrate(queryClient)}><ClientesListado /></HydrationBoundary>;
}

export default function ClientesPage() {
  return <Suspense fallback={<p role="status" className="p-6">Cargando clientes…</p>}>
    <ClientesAutorizados />
  </Suspense>;
}
