"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { nombreDiagnosticoGeneral } from "@/features/ordenes/diagnostico-general";
import { actualizarServicio, registrarServicio } from "../acciones";
import type { ServicioListado } from "../consultas";
import { CamposServicio } from "./campos-servicio";

export function FormularioServicio({ servicio }: { servicio?: ServicioListado }) {
  const id = useId();
  const titulo = servicio ? "Editar servicio" : "Nuevo servicio";
  const esDiagnostico = servicio?.nombre === nombreDiagnosticoGeneral;
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current) return;
    const formulario = new FormData(evento.currentTarget);
    pendiente.current = true;
    setGuardando(true);
    setError("");

    try {
      const resultado = servicio ? await actualizarServicio(servicio.id, formulario) : await registrarServicio(formulario);
      if ("error" in resultado) {
        setError(resultado.error ?? "No se pudo guardar el servicio.");
        return;
      }

      setAbierto(false);
      const nombre = formulario.get("nombre");
      notificarGuardado(servicio ? "Servicio actualizado" : "Servicio registrado",
        typeof nombre === "string" ? nombre.trim() : undefined);
    } catch {
      setError("No se pudo confirmar el guardado. Inténtalo nuevamente.");
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={(valor) => {
      if (pendiente.current) return;
      if (valor) setError("");
      setAbierto(valor);
    }}>
      <DialogTrigger render={<Button variant={servicio ? "outline" : "default"} size={servicio ? "sm" : "default"}
        aria-label={servicio ? "Editar " + servicio.nombre : undefined} />}>
        {servicio ? "Editar" : titulo}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{servicio?.nombre ?? "Registra la tarifa de referencia para las cotizaciones."}</DialogDescription>
        </DialogHeader>
        {abierto && <form onSubmit={guardar} className="grid gap-4" aria-busy={guardando}>
          <fieldset disabled={guardando} className="grid gap-3">
            <CamposServicio valores={servicio} nombreReservado={esDiagnostico} />
            {esDiagnostico ? <>
              <input type="hidden" name="activo" value="true" />
              <p className="text-xs text-muted-foreground">Diagnóstico general conserva su nombre y se mantiene activo para iniciar diagnósticos.</p>
            </> : servicio && <div className="grid gap-2">
              <Label htmlFor={id + "-estado"}>Estado del servicio</Label>
              <Select name="activo" defaultValue={String(servicio.activo)}>
                <SelectTrigger id={id + "-estado"} className="w-full" aria-describedby={id + "-ayuda-estado"}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Activo</SelectItem>
                  <SelectItem value="false">Inactivo</SelectItem>
                </SelectContent>
              </Select>
              <p id={id + "-ayuda-estado"} className="text-xs text-muted-foreground">
                Solo los servicios activos están disponibles para cotizar.
              </p>
            </div>}
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={guardando} onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Guardar servicio"}</Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  );
}
