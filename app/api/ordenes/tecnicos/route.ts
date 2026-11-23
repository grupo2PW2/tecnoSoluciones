
import { listarTecnicosIngreso } from "@/features/ordenes/asignacion";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) {
    return Response.json({ message: "Tu usuario no tiene permiso para asignar técnicos." }, { status: usuario ? 403 : 401 });
  }

  try {
    return Response.json(await listarTecnicosIngreso());
  } catch (error) {
    console.error("Error al consultar técnicos:", error);
    return Response.json({ message: "No se pudo consultar la disponibilidad de técnicos." }, { status: 500 });
  }
}
