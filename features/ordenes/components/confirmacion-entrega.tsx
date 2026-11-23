
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mostrarBs } from "@/features/presupuestos/importes";
import { registrarEntrega } from "../acciones-entrega";

export function ConfirmacionEntrega({ ordenId, codigo, operacion, monto }: {
  ordenId: number; codigo: string; operacion: "entrega" | "devolucion"; monto: string | null;
}) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [registrada, setRegistrada] = useState(false);
  const [actualizando, actualizar] = useTransition();
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const router = useRouter();
  const ocupado = guardando || actualizando || registrada;
  const entrega = operacion === "entrega" ? "entrega" : "devolución";
  const conCobro = monto !== null && monto !== "0.00";
  const accion = conCobro ? "cobro y " + entrega : entrega;

  async function confirmar() {
    if (pendiente.current) return;
    pendiente.current = true;
    setGuardando(true);
    setError("");

    try {
      const resultado = await registrarEntrega({ ordenId, montoConfirmado: monto });
      if ("error" in resultado) {
        setError(resultado.error ?? "No se pudo registrar la entrega.");
      } else {
        const registro = operacion === "entrega" ? "Entrega registrada" : "Devolución registrada";
        notificarGuardado(conCobro ? "Cobro y " + entrega + " registrados" : registro, "Orden " + codigo);
        setRegistrada(true);
        setAbierto(false);
      }
      actualizar(() => router.refresh());
    } catch {
      setError("No se pudo confirmar el registro. Inténtalo nuevamente.");
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={(valor) => {
      if (!pendiente.current) {
        if (valor) setError("");
        setAbierto(valor);
      }
    }}>
      <DialogTrigger render={<Button disabled={ocupado} />}>Registrar {accion}</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirmar {accion}</DialogTitle>
          <DialogDescription>{conCobro
            ? "Confirma que recibiste " + mostrarBs(monto) + " y que entregaste el equipo de la orden " + codigo + "."
            : "Confirma que entregaste el equipo de la orden " + codigo + " sin cobrar."}</DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={ocupado} onClick={() => setAbierto(false)}>Volver</Button>
          <Button disabled={ocupado} onClick={() => void confirmar()}>
            {guardando ? "Registrando…" : "Confirmar " + accion}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
