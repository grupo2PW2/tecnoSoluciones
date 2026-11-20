export interface FiltrosClientes {
  buscar: string;
  page: number;
  limit: number;
}

export function normalizarFiltros(
  buscar?: string,
  page?: string
): FiltrosClientes {
  const numeroPagina = Number(page ?? "1");

  return {
    buscar: (buscar ?? "").trim().slice(0, 100),
    page:
      Number.isSafeInteger(numeroPagina) && numeroPagina > 0
        ? numeroPagina
        : 1,
    limit: 10,
  };
}