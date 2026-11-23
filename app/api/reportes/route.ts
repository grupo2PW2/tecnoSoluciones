import { consultarOrdenesReporte, consultarTrabajoReporte } from "@/features/reportes/consultas";
import { ordenesReporteSchema, periodoReporteSchema } from "@/features/reportes/filtros";
import { puedeConsultarReportes } from "@/features/reportes/modelo";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  const usuario = await getCurrentUser();
  if (!puedeConsultarReportes(usuario?.rol)) {
    return Response.json({ error: "Tu usuario no tiene permiso para consultar reportes." }, { status: usuario ? 403 : 401 });
  }

  const params = new URL(request.url).searchParams;
  const periodo = periodoReporteSchema.safeParse({ desde: params.get("desde"), hasta: params.get("hasta") });
  if (!periodo.success) return Response.json({ error: periodo.error.issues[0].message }, { status: 400 });

  const vista = params.get("vista");
  const headers = { "Cache-Control": "private, no-store" };
  try {
    if (vista === "trabajo") return Response.json(await consultarTrabajoReporte(periodo.data), { headers });
    if (vista === "ordenes") {
      const filtros = ordenesReporteSchema.safeParse({ estado: params.get("estado"), pagina: params.get("pagina") });
      if (!filtros.success) return Response.json({ error: "Selecciona un estado y una página válidos." }, { status: 400 });
      return Response.json(await consultarOrdenesReporte(periodo.data, filtros.data), { headers });
    }
    return Response.json({ error: "Selecciona un reporte válido." }, { status: 400 });
  } catch (error) {
    console.error("Error al consultar reportes:", error);
    return Response.json({ error: "No se pudo cargar el reporte. Inténtalo nuevamente." }, { status: 500 });
  }
}
