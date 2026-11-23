import { z } from "zod";
import { rolesUsuario, type RolUsuario } from "./modelo";

const contrasena = z.string().min(8, "La contraseña debe tener al menos 8 caracteres.")
  .max(128, "La contraseña no puede superar 128 caracteres.")
  .refine((valor) => Boolean(valor.trim()), "Escribe una contraseña válida.");
const rol = z.enum(Object.keys(rolesUsuario) as RolUsuario[], { error: "Selecciona un rol válido." });

const fichaUsuario = z.object({
  nombre: z.string().trim().min(1, "Escribe el nombre.").max(100),
  apellido: z.string().trim().min(1, "Escribe el apellido.").max(100),
  DNI: z.string().trim().min(1, "Escribe el documento de identidad.").max(40),
  telefono: z.string().trim().max(40),
  username: z.string().trim().min(1, "Escribe un nombre de usuario.").max(100),
});

export const altaUsuarioSchema = fichaUsuario.extend({ rol, password: contrasena });
export const edicionUsuarioSchema = fichaUsuario.extend({ password: z.union([z.literal(""), contrasena]) });

export const accesoUsuarioSchema = z.object({ rol, activo: z.boolean() });
export type AccesoUsuario = z.infer<typeof accesoUsuarioSchema>;

export type AltaUsuario = z.infer<typeof altaUsuarioSchema>;
export type EdicionUsuario = z.infer<typeof edicionUsuarioSchema>;

export function leerFichaUsuario(formulario: FormData) {
  return {
    nombre: formulario.get("nombre"),
    apellido: formulario.get("apellido"),
    DNI: formulario.get("DNI"),
    telefono: formulario.get("telefono") ?? "",
    username: formulario.get("username"),
    password: formulario.get("password"),
  };
}
