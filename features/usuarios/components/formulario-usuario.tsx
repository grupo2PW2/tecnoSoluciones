"use client";

import { useId } from "react";
import { notificarGuardado } from "@/components/notificaciones";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectorImagen } from "@/features/imagenes/components/selector-imagen";
import { urlAvatar } from "../avatar";
import { DialogoAlta } from "@/features/ordenes/components/dialogo-alta";
import { actualizarUsuario, registrarUsuario } from "../acciones";
import type { UsuarioListado } from "../consultas";
import { rolesUsuario } from "../modelo";

export function FormularioUsuario({ usuario }: { usuario?: UsuarioListado }) {
  const id = useId();

  return (
    <DialogoAlta titulo={usuario ? "Editar usuario" : "Nuevo usuario"}
      descripcion={usuario ? usuario.nombre + " " + usuario.apellido + " · " + usuario.username : "Registra la cuenta y su rol de acceso."}
      etiquetaGuardar="Guardar usuario" principal={!usuario}
      guardar={async (formulario) => {
        const resultado = usuario ? await actualizarUsuario(usuario.id, formulario) : await registrarUsuario(formulario);
        return "error" in resultado
          ? { error: resultado.error ?? "No se pudo guardar el usuario." }
          : { opcion: resultado.usuario };
      }}
      alGuardar={() => notificarGuardado(usuario ? "Usuario actualizado" : "Usuario registrado")}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor={id + "-nombre"}>Nombre</Label>
          <Input id={id + "-nombre"} name="nombre" defaultValue={usuario?.nombre} maxLength={100} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={id + "-apellido"}>Apellido</Label>
          <Input id={id + "-apellido"} name="apellido" defaultValue={usuario?.apellido} maxLength={100} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={id + "-dni"}>CI / DNI</Label>
          <Input id={id + "-dni"} name="DNI" defaultValue={usuario?.DNI} maxLength={40} required />
        </div>
        <div className="grid gap-2">
          <Label htmlFor={id + "-telefono"}>Teléfono (opcional)</Label>
          <Input id={id + "-telefono"} name="telefono" type="tel" defaultValue={usuario?.telefono ?? ""} maxLength={40} />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id + "-usuario"}>Nombre de usuario</Label>
        <Input id={id + "-usuario"} name="username" defaultValue={usuario?.username} autoComplete="username" maxLength={100} required />
      </div>
      {!usuario && <div className="grid gap-2">
        <Label htmlFor={id + "-rol"}>Rol</Label>
        <Select name="rol" items={rolesUsuario} required>
          <SelectTrigger id={id + "-rol"} className="w-full"><SelectValue placeholder="Selecciona un rol" /></SelectTrigger>
          <SelectContent>
            {Object.entries(rolesUsuario).map(([valor, etiqueta]) => <SelectItem key={valor} value={valor}>{etiqueta}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>}
      <div className="grid gap-2">
        <Label htmlFor={id + "-clave"}>{usuario ? "Nueva contraseña (opcional)" : "Contraseña"}</Label>
        <Input id={id + "-clave"} name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128}
          required={!usuario} aria-describedby={id + "-clave-ayuda"} />
        <p className="text-xs text-muted-foreground" id={id + "-clave-ayuda"}>
          {usuario ? "Déjala en blanco para conservar la contraseña actual." : "Usa al menos 8 caracteres."}
        </p>
      </div>
      <SelectorImagen src={usuario ? urlAvatar(usuario.id, usuario.avatar) : null} />
    </DialogoAlta>
  );
}
