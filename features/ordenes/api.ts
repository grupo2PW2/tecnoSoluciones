
import type { EstadoOrden, OpcionIngreso, TecnicoIngreso, VistaTecnica } from "./modelo";
import type { ResultadoBandejaTecnica, ResultadoOrdenes } from "./queries";

async function consultar<T>(url: string, params: URLSearchParams, signal: AbortSignal): Promise<T> {
  const respuesta = await fetch(url + "?" + params.toString(), { signal });
  if (!respuesta.ok) {
    const error = await respuesta.json().catch(() => null);
    throw new Error(error?.message ?? "No se pudo completar la consulta.");
  }

  return respuesta.json();
}

export function consultarBandeja(
  buscar: string, estado: EstadoOrden | "", pagina: number, signal: AbortSignal,
) {
  const params = new URLSearchParams({ buscar, estado, pagina: String(pagina) });
  return consultar<ResultadoOrdenes>("/api/ordenes", params, signal);
}

export function consultarBandejaTecnica(vista: VistaTecnica, buscar: string, pagina: number, signal: AbortSignal) {
  const params = new URLSearchParams({ vista, buscar, pagina: String(pagina) });
  return consultar<ResultadoBandejaTecnica>("/api/ordenes/bandeja-tecnica", params, signal);
}

export function consultarTecnicos(signal: AbortSignal) {
  return consultar<TecnicoIngreso[]>("/api/ordenes/tecnicos", new URLSearchParams(), signal);
}

export function consultarOpciones(buscar: string, clienteId: number | undefined, signal: AbortSignal) {
  const params = new URLSearchParams({ buscar });
  if (clienteId !== undefined) params.set("cliente", String(clienteId));
  return consultar<OpcionIngreso[]>("/api/ordenes/seleccion", params, signal);
}
