import { notFound } from "next/navigation";
import { obtenerClientePorId } from "@/features/clientes/queries";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClienteDetallePage({ params }: Props) {
  const { id } = await params;

  const clienteId = Number(id);

  if (!Number.isSafeInteger(clienteId) || clienteId <= 0) {
    notFound();
  }

  const cliente = await obtenerClientePorId(clienteId);

  if (!cliente) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Detalle del cliente</h1>

      <p>Nombre: {cliente.nombre}</p>

      <p>Apellido: {cliente.ciudad}</p>

      <p>DNI: {cliente.direccion}</p>
      
    </section>
  );
}
