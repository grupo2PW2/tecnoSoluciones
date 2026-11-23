
"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { asignarTecnico } from "../actions";
import { SelectorTecnico } from "./selector-tecnico";

export function DialogoAsignacion({ ordenId, codigo, actualizarDetalle }: { ordenId: number; codigo: string; actualizarDetalle?: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [tecnicoId, setTecnicoId] = useState<number | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (tecnicoId === null || pendiente.current) return;

    pendiente.current = true;
    setGuardando(true);
    setError("");
    try {
      const resultado = await asignarTecnico(ordenId, tecnicoId);
      if (resultado.asignada) {
        notificarGuardado("Técnico asignado", "Orden " + codigo);
        setAbierto(false);
        if (actualizarDetalle) router.refresh();
        void queryClient.invalidateQueries({ queryKey: ["ordenes"] });
      } else {
        setError(resultado.error ?? "No se pudo asignar el técnico.");
      }
      void queryClient.invalidateQueries({ queryKey: ["tecnicos-ingreso"] });
    } catch {
      setError("No se pudo confirmar la asignación. Inténtalo nuevamente.");
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={(valor) => {
      if (pendiente.current) return;
      if (valor) {
        setTecnicoId(null);
        setError("");
      }
      setAbierto(valor);
    }}>
      <DialogTrigger render={<Button type="button" variant="outline" size="sm" aria-label={"Asignar técnico a " + codigo} />}>
        Asignar técnico
      </DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Asignar técnico</DialogTitle>
          <DialogDescription>Selecciona quién atenderá la orden {codigo}.</DialogDescription>
        </DialogHeader>
        {abierto && <form onSubmit={guardar} className="grid gap-4" aria-busy={guardando}>
          <SelectorTecnico valor={tecnicoId} alSeleccionar={setTecnicoId} disabled={guardando} />
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={guardando} onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={tecnicoId === null || guardando}>{guardando ? "Asignando…" : "Asignar"}</Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  );
}
