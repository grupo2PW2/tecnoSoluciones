import { normalizarFiltros } from "@/features/clientes/filters";
import { obtenerEquiposPaginados } from "@/features/dispositivos/queries";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) {
    return Response.json({ message: "Tu usuario no tiene permiso para consultar dispositivos." }, { status: usuario ? 403 : 401 });
  }

  const params = new URL(request.url).searchParams;
  const filtros = normalizarFiltros(params.get("buscar") ?? undefined, params.get("page") ?? undefined);
  try {
    return Response.json(await obtenerEquiposPaginados(filtros));
  } catch (error) {
    console.error("Error al consultar los dispositivos:", error);
    return Response.json({ message: "No se pudieron consultar los dispositivos." }, { status: 500 });
  }
}
