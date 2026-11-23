"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { retirarPresupuesto } from "../acciones-retiro";

export function RetirarOferta({ ordenId, presupuestoId, version }: {
  ordenId: number; presupuestoId: number; version: number;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [actualizando, actualizar] = useTransition();
  const [error, setError] = useState("");
  const pendiente = useRef(false);

  async function confirmar() {
    if (pendiente.current) return;
    pendiente.current = true;
    setGuardando(true);
    setError("");

    try {
      const resultado = await retirarPresupuesto({ ordenId, presupuestoId });
      if ("error" in resultado) {
        setError(resultado.error ?? "No se pudo retirar la oferta.");
      } else {
        notificarGuardado("Oferta retirada", "Versión " + version);
        setAbierto(false);
      }
      actualizar(() => router.refresh());
    } catch {
      setError("No se pudo confirmar el retiro. Inténtalo nuevamente.");
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
      <DialogTrigger render={<Button variant="outline" disabled={actualizando} />}>Retirar oferta</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Retirar oferta</DialogTitle>
          <DialogDescription>
            La versión {version} dejará de admitir respuestas de inmediato. La orden seguirá abierta para preparar una nueva oferta.
          </DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={guardando} onClick={() => setAbierto(false)}>Volver</Button>
          <Button variant="destructive" disabled={guardando || actualizando} onClick={() => void confirmar()}>
            {guardando ? "Retirando…" : "Confirmar retiro"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
