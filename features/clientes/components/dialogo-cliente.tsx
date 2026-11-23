"use client";

import { useQueryClient } from "@tanstack/react-query";
import { notificarGuardado } from "@/components/notificaciones";
import { DialogoAlta } from "@/features/ordenes/components/dialogo-alta";
import { crearCliente, actualizarCliente } from "../actions";
import type { ClienteListado } from "../types";
import { CamposCliente } from "./form-data";

export function DialogoCliente({ cliente, principal, alGuardar }: {
  cliente?: ClienteListado;
  principal?: boolean;
  alGuardar?: () => void;
}) {
  const queryClient = useQueryClient();

  return (
    <DialogoAlta titulo={cliente ? "Editar cliente" : "Nuevo cliente"}
      descripcion={cliente ? "Actualiza los datos de contacto de la ficha." : "Registra los datos de contacto del cliente."}
      etiquetaGuardar="Guardar cliente" principal={principal}
      guardar={async (formulario) => {
        const resultado = cliente ? await actualizarCliente(cliente.id, formulario) : await crearCliente(formulario);
        return resultado.cliente ? { opcion: resultado.cliente } : { error: resultado.error ?? "No se pudo guardar el cliente." };
      }}
      alGuardar={() => {
        alGuardar?.();
        notificarGuardado(cliente ? "Cliente actualizado" : "Cliente registrado");
        void queryClient.invalidateQueries({ queryKey: ["clientes"] });
        void queryClient.invalidateQueries({ queryKey: ["seleccion-ingreso", null] });
        if (cliente) void queryClient.invalidateQueries({ queryKey: ["dispositivos"] });
      }}>
      <CamposCliente cliente={cliente} />
    </DialogoAlta>
  );
}
