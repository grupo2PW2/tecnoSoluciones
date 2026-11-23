import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { ClienteDetalle } from "@/features/clientes/components/cliente-detalle";
import { obtenerClientePorId } from "@/features/clientes/queries";
import { listarEquiposDeCliente } from "@/features/dispositivos/queries";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { idSchema } from "@/features/ordenes/schemas";
import { getCurrentUser } from "@/lib/auth";

interface Props {
  params: Promise<{ id: string }>;
}

async function Detalle({ params }: Props) {
  const usuario = await getCurrentUser();
  if (!usuario) redirect("/login");
  if (!puedeRegistrarIngreso(usuario.rol)) {
    return <p role="alert" className="p-6">Tu usuario no tiene permiso para consultar esta ficha.</p>;
  }

  const { id } = await params;
  const clienteId = idSchema.safeParse(Number(id));
  if (!clienteId.success) notFound();
  await connection();

  const resultado = await Promise.all([
    obtenerClientePorId(clienteId.data),
    listarEquiposDeCliente(clienteId.data),
  ]).catch((error: unknown) => {
    console.error("Error al consultar la ficha del cliente:", error);
    return null;
  });
  if (!resultado) return <p role="alert" className="p-6">No se pudo consultar la ficha. Actualiza la página para reintentar.</p>;
  const [cliente, equipos] = resultado;
  if (!cliente) notFound();

  return <ClienteDetalle cliente={cliente} equipos={equipos} />;
}

export default function ClienteDetallePage({ params }: Props) {
  return <Suspense fallback={<p role="status" className="p-6">Cargando cliente…</p>}>
    <Detalle params={params} />
  </Suspense>;
}
