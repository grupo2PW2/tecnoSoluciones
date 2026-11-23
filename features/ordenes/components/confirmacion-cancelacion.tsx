
"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cancelarOrden } from "../acciones-cancelacion";

export function ConfirmacionCancelacion({ ordenId, codigo, aprobada }: {
  ordenId: number;
  codigo: string;
  aprobada: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [actualizando, actualizar] = useTransition();
  const [cancelada, setCancelada] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const ocupado = guardando || actualizando || cancelada;

  async function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current) return;
    const texto = motivo.trim();
    if (!texto) {
      setError("Escribe el motivo de cancelación.");
      return;
    }

    pendiente.current = true;
    setGuardando(true);
    setError("");
    try {
      const resultado = await cancelarOrden({ ordenId, motivo: texto });
      if ("error" in resultado) {
        setError(resultado.error ?? "No se pudo cancelar la orden.");
      } else {
        notificarGuardado("Orden cancelada", "Orden " + codigo);
        setCancelada(true);
        setAbierto(false);
      }
      void queryClient.invalidateQueries({ queryKey: ["ordenes"] });
      void queryClient.invalidateQueries({ queryKey: ["tecnicos-ingreso"] });
      actualizar(() => router.refresh());
    } catch {
      setError("No se pudo confirmar la cancelación. Inténtalo nuevamente.");
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
      <DialogTrigger render={<Button variant="destructive" disabled={ocupado} />}>Cancelar orden</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Cancelar orden {codigo}</DialogTitle>
          <DialogDescription>
            Podrás registrar la devolución del equipo sin cobro.
            {aprobada && " La aprobación se conservará en el historial."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={confirmar} className="grid gap-4" aria-busy={ocupado}>
          <div className="grid gap-2">
            <Label htmlFor="motivo-cancelacion">Motivo de cancelación</Label>
            <Textarea id="motivo-cancelacion" required rows={3} maxLength={1000} disabled={ocupado}
              value={motivo} onChange={(evento) => setMotivo(evento.target.value)} />
          </div>
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={ocupado} onClick={() => setAbierto(false)}>Volver</Button>
            <Button type="submit" variant="destructive" disabled={ocupado}>
              {guardando ? "Cancelando…" : "Confirmar cancelación"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
