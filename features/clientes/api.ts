import type { ResultadoClientes } from "./types";

interface ObtenerClientesParams {
  buscar: string;
  page: number;
}

export async function fetchClientes(
  { buscar, page }: ObtenerClientesParams,
  signal?: AbortSignal,
): Promise<ResultadoClientes> {
  const params = new URLSearchParams({
    buscar,
    page: String(page),
  });

  const response = await fetch(`/api/clientes?${params.toString()}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error("No se pudieron obtener los clientes.");
  }

  return response.json();
}
