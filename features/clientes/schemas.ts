
import { z } from "zod";

export const clienteSchema = z.object({
  nombre: z.string().trim().min(1, "Escribe el nombre.").max(100),
  apellido: z.string().trim().min(1, "Escribe el apellido.").max(100),
  telefono: z.string().trim().max(40),
  direccion: z.string().trim().max(255),
});

export function validarFichaCliente(formulario: FormData) {
  return clienteSchema.safeParse({
    nombre: formulario.get("nombre"),
    apellido: formulario.get("apellido"),
    telefono: formulario.get("telefono") ?? "",
    direccion: formulario.get("direccion") ?? "",
  });
}
