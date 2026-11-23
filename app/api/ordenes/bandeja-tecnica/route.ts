
import { puedeTomarOrdenes } from "@/features/ordenes/modelo";
import { listarBandejaTecnica } from "@/features/ordenes/queries";
import { idSchema } from "@/features/ordenes/schemas";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const usuario = await getCurrentUser();
  if (!usuario || !puedeTomarOrdenes(usuario.rol)) {
    return Response.json({ message: "Tu usuario no tiene permiso para consultar la bandeja técnica." }, { status: usuario ? 403 : 401 });
  }

  const params = new URL(request.url).searchParams;
  const vista = params.get("vista") ?? "disponibles";
  if (vista !== "disponibles" && vista !== "mis-ordenes") {
    return Response.json({ message: "La vista solicitada no es válida." }, { status: 400 });
  }

  const buscar = (params.get("buscar") ?? "").trim().slice(0, 100);
  const pagina = idSchema.safeParse(Number(params.get("pagina"))).data ?? 1;

  try {
    return Response.json(await listarBandejaTecnica(usuario.id, vista, buscar, pagina));
  } catch (error) {
    console.error("Error al consultar la bandeja técnica:", error);
    return Response.json({ message: "No se pudieron consultar las órdenes." }, { status: 500 });
  }
}
