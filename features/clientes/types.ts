import type { obtenerClientesPaginados } from "./queries";

export type ResultadoClientes = Awaited<
  ReturnType<typeof obtenerClientesPaginados>
>;

export type ClienteListado = ResultadoClientes["clientes"][number];
