
"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";
import { idSchema } from "@/features/ordenes/schemas";
import { validarFichaCliente } from "./schemas";

export async function crearCliente(formData: FormData) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) {
    return { error: "Tu usuario no tiene permiso para registrar clientes." };
  }

  const resultado = validarFichaCliente(formData);
  if (!resultado.success) return { error: resultado.error.issues[0].message };

  const { nombre, apellido, telefono, direccion } = resultado.data;
  try {
    const cliente = await db.orm.public.Clientes
      .select("id", "nombre", "apellido", "telefono", "direccion")
      .create({ nombre, apellido, telefono: telefono || null, direccion: direccion || null });
    revalidatePath("/clientes");
    return { cliente };
  } catch (error) {
    console.error("Error al registrar cliente:", error);
    return { error: "No se pudo registrar el cliente. Inténtalo de nuevo." };
  }
}

export async function actualizarCliente(id: number, formulario: FormData) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) return { error: "Tu usuario no tiene permiso para editar clientes." };

  const clienteId = idSchema.safeParse(id);
  if (!clienteId.success) return { error: "Selecciona un cliente válido." };
  const resultado = validarFichaCliente(formulario);
  if (!resultado.success) return { error: resultado.error.issues[0].message };

  const { nombre, apellido, telefono, direccion } = resultado.data;
  try {
    const cliente = await db.transaction(async (tx) => {
      const registro = await tx.orm.public.Clientes.where({ id: clienteId.data }).select("id").forNoKeyUpdate().first();
      if (!registro) return null;
      await tx.orm.public.Clientes.where({ id: registro.id }).update({
        nombre, apellido, telefono: telefono || null, direccion: direccion || null,
      });
      return { id: registro.id };
    });
    if (!cliente) return { error: "El cliente ya no está registrado." };
    revalidatePath("/clientes/" + cliente.id);
    revalidatePath("/dispositivos");
    return { cliente };
  } catch (error) {
    console.error("Error al actualizar cliente:", error);
    return { error: "No se pudo actualizar el cliente. Inténtalo de nuevo." };
  }
}
