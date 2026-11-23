"use client";

import { useId } from "react";
import { notificarGuardado } from "@/components/notificaciones";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DialogoAlta } from "@/features/ordenes/components/dialogo-alta";
import { actualizarAccesoUsuario } from "../acciones";
import type { UsuarioListado } from "../consultas";
import { rolesUsuario } from "../modelo";

export function FormularioAcceso({ usuario, esPropio }: { usuario: UsuarioListado; esPropio: boolean }) {
  const id = useId();
  const tieneOrdenes = usuario.rol === "TECNICO" && usuario.tecnico > 0;
  const rolFijo = usuario.rol === "ADMINISTRADOR" || tieneOrdenes;
  if (esPropio || (tieneOrdenes && usuario.activo)) {
    return <p className="max-w-40 whitespace-normal pt-1 text-left text-xs text-muted-foreground">
      {esPropio ? "Otro administrador gestiona tu estado." : "Órdenes pendientes de cierre técnico."}
    </p>;
  }

  return (
    <DialogoAlta titulo="Gestionar acceso" descripcion={usuario.nombre + " " + usuario.apellido + " · " + usuario.username}
      etiquetaGuardar="Guardar acceso"
      guardar={async (formulario) => {
        const resultado = await actualizarAccesoUsuario(usuario.id, formulario, { rol: usuario.rol, activo: usuario.activo });
        return resultado.usuario ? { opcion: resultado.usuario } : { error: resultado.error ?? "No se pudo guardar el acceso." };
      }}
      alGuardar={() => notificarGuardado("Acceso guardado", usuario.username)}>
      {rolFijo ? <div>
        <input type="hidden" name="rol" value={usuario.rol} />
        <p className="font-medium">{rolesUsuario[usuario.rol]}</p>
        <p className="text-xs text-muted-foreground">
          {tieneOrdenes ? "El rol se conserva mientras tenga órdenes pendientes de cierre." : "El rol de una cuenta administradora es fijo."}
        </p>
      </div> : <div className="grid gap-2">
        <Label htmlFor={id + "-rol"}>Rol</Label>
        <Select name="rol" items={rolesUsuario} defaultValue={usuario.rol}>
          <SelectTrigger id={id + "-rol"} className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(rolesUsuario).map(([valor, etiqueta]) => <SelectItem key={valor} value={valor}>{etiqueta}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Al asignar Administración, el rol queda fijo.</p>
      </div>}
      <div className="grid gap-2">
        <Label htmlFor={id + "-estado"}>Estado de la cuenta</Label>
        <Select name="activo" defaultValue={String(usuario.activo)}>
          <SelectTrigger id={id + "-estado"} className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Activo</SelectItem>
            <SelectItem value="false">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </DialogoAlta>
  );
}
