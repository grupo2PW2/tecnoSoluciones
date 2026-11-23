import { responderImagen, respuestaImagenVacia } from "@/features/imagenes/respuesta";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { idSchema } from "@/features/ordenes/schemas";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) return respuestaImagenVacia(usuario ? 403 : 401);

  const id = idSchema.safeParse(Number((await params).id));
  if (!id.success) return respuestaImagenVacia(404);

  try {
    const equipo = await db.orm.public.Dispositivos.select("imgUrl").first({ id: id.data });
    return await responderImagen("dispositivos", equipo?.imgUrl ?? null);
  } catch (error) {
    console.error("Error al consultar imagen de dispositivo:", error);
    return respuestaImagenVacia(503);
  }
}
