"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { fetchClientes } from "../api";

interface UseClientesParams {
  buscar: string;
  page: number;
}

export function useClientes({ buscar, page }: UseClientesParams) {
  return useQuery({
    queryKey: ["clientes", { buscar, page }],

    queryFn: ({ signal }) => fetchClientes({ buscar, page }, signal),

    placeholderData: keepPreviousData,

    staleTime: 30_000,
  });
}
