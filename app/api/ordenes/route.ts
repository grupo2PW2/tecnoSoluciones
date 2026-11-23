
import { getCurrentUser } from "@/lib/auth";
import { puedeConsultarOrdenes } from "@/features/ordenes/modelo";
import { listarOrdenes } from "@/features/ordenes/queries";
import { estadoOrdenSchema, idSchema } from "@/features/ordenes/schemas";

export async function GET(request: Request) {
  const usuario = await getCurrentUser();
  if (!puedeConsultarOrdenes(usuario?.rol)) {
    return Response.json({ message: "Tu usuario no tiene permiso para consultar órdenes." }, { status: usuario ? 403 : 401 });
  }

  const params = new URL(request.url).searchParams;
  const buscar = (params.get("buscar") ?? "").trim().slice(0, 100);
  const estado = estadoOrdenSchema.safeParse(params.get("estado")).data;
  const pagina = idSchema.safeParse(Number(params.get("pagina"))).data ?? 1;

  try {
    return Response.json(await listarOrdenes(buscar, estado, pagina));
  } catch (error) {
    console.error("Error al consultar órdenes:", error);
    return Response.json({ message: "No se pudieron consultar las órdenes." }, { status: 500 });
  }
}
