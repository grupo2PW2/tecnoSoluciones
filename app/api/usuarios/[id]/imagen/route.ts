import { responderImagen, respuestaImagenVacia } from "@/features/imagenes/respuesta";
import { idSchema } from "@/features/ordenes/schemas";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const usuario = await getCurrentUser();
  if (!usuario) return respuestaImagenVacia(401);

  const id = idSchema.safeParse(Number((await params).id));
  if (!id.success) return respuestaImagenVacia(404);
  if (usuario.id !== id.data && usuario.rol !== "ADMINISTRADOR") return respuestaImagenVacia(403);

  try {
    const avatar = usuario.id === id.data
      ? usuario.avatar
      : (await db.orm.public.Usuarios.select("avatar").first({ id: id.data }))?.avatar ?? null;
    return await responderImagen("usuarios", avatar);
  } catch (error) {
    console.error("Error al consultar avatar:", error);
    return respuestaImagenVacia(503);
  }
}
