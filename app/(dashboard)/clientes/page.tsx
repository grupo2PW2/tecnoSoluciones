import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import { obtenerClientesPaginados } from "@/features/clientes/queries";

import { ClientesListado } from "@/features/clientes/components/clientes-listado";

export default async function ClientesPage() {
  // TODO: verificar sesión y permisos de lectura.

  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ["clientes", { buscar: "", page: 1 }],

    queryFn: () =>
      obtenerClientesPaginados({
        buscar: "",
        page: 1,
        limit: 10,
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ClientesListado />
    </HydrationBoundary>
  );
}
