
import { getCurrentUser } from "@/lib/auth";
import { normalizarFiltros } from "@/features/clientes/filters";
import { obtenerClientesPaginados } from "@/features/clientes/queries";
import { buscarDispositivos } from "@/features/dispositivos/queries";
import { puedeRegistrarIngreso, textoCliente, textoEquipo } from "@/features/ordenes/modelo";
import { idSchema } from "@/features/ordenes/schemas";

export async function GET(request: Request) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) {
    return Response.json({ message: "Tu usuario no tiene permiso para registrar ingresos." }, { status: usuario ? 403 : 401 });
  }

  const params = new URL(request.url).searchParams;
  const filtros = normalizarFiltros(params.get("buscar") ?? undefined);
  const cliente = params.get("cliente");

  try {
    if (cliente === null) {
      const { clientes } = await obtenerClientesPaginados(filtros);
      return Response.json(clientes.map((registro) => ({
        id: registro.id,
        etiqueta: [textoCliente(registro), registro.telefono].filter(Boolean).join(" · "),
      })));
    }

    const id = idSchema.safeParse(Number(cliente));
    if (!id.success) return Response.json({ message: "Selecciona un cliente válido." }, { status: 400 });

    const equipos = await buscarDispositivos(id.data, filtros.buscar);
    return Response.json(equipos.map((equipo) => ({
      id: equipo.id,
      etiqueta: [textoEquipo(equipo), equipo.nroSerie].filter(Boolean).join(" · "),
    })));
  } catch (error) {
    console.error("Error al consultar opciones de ingreso:", error);
    return Response.json({ message: "No se pudo completar la búsqueda." }, { status: 500 });
  }
}
