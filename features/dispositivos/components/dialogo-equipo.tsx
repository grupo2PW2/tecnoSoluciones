"use client";

import { useQueryClient } from "@tanstack/react-query";
import { notificarGuardado } from "@/components/notificaciones";
import { SelectorImagen } from "@/features/imagenes/components/selector-imagen";
import { urlImagen } from "@/features/imagenes/modelo";
import { DialogoAlta } from "@/features/ordenes/components/dialogo-alta";
import { textoEquipo } from "@/features/ordenes/modelo";
import { actualizarDispositivo, crearDispositivo } from "../actions";
import type { EquipoFicha } from "../queries";
import { CamposEquipo } from "./campos-equipo";

export function DialogoEquipo({ clienteId, equipo, principal }: { clienteId: number; equipo?: EquipoFicha; principal?: boolean }) {
  const queryClient = useQueryClient();

  return (
    <DialogoAlta titulo={equipo ? "Editar equipo" : "Nuevo equipo"}
      descripcion={equipo ? textoEquipo(equipo) : "Registra un equipo para este cliente."}
      etiquetaGuardar="Guardar equipo" principal={principal}
      guardar={async (formulario) => {
        const resultado = equipo
          ? await actualizarDispositivo(equipo.id, clienteId, formulario)
          : await crearDispositivo(clienteId, formulario);
        return "error" in resultado
          ? { error: resultado.error ?? "No se pudo guardar el equipo." }
          : { opcion: resultado.dispositivo };
      }}
      alGuardar={() => {
        notificarGuardado(equipo ? "Equipo actualizado" : "Equipo registrado");
        void queryClient.invalidateQueries({ queryKey: ["dispositivos"] });
        void queryClient.invalidateQueries({ queryKey: ["seleccion-ingreso", clienteId] });
      }}>
      <CamposEquipo equipo={equipo} />
      <SelectorImagen src={equipo ? urlImagen("dispositivos", equipo.id, equipo.imgUrl) : null} />
    </DialogoAlta>
  );
}
