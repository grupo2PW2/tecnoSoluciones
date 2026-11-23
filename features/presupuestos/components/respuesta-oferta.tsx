
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { responderPresupuestoEnTienda, responderPresupuestoWeb } from "../acciones-respuesta";
import { mostrarBs } from "../importes";
import type { DetallePresupuesto } from "../modelo";
import type { DecisionPresupuesto, OrigenRespuesta } from "../respuesta-modelo";

export function RespuestaOferta({ presupuesto, origen, puedeAprobar = true }: {
  presupuesto: Pick<DetallePresupuesto, "id" | "version" | "total">;
  origen: OrigenRespuesta;
  puedeAprobar?: boolean;
}) {
  const [decision, setDecision] = useState<DecisionPresupuesto | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);
  const [actualizando, actualizar] = useTransition();
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const disparador = useRef<HTMLButtonElement | null>(null);
  const router = useRouter();
  const enTienda = origen.canal === "EN_TIENDA";
  const ocupado = guardando || actualizando || guardado;
  const aprobando = decision === "APROBAR";

  async function confirmar() {
    if (!decision || pendiente.current) return;
    pendiente.current = true;
    setGuardando(true);
    setError("");

    try {
      const solicitud = { presupuestoId: presupuesto.id, decision };
      const resultado = origen.canal === "EN_TIENDA"
        ? await responderPresupuestoEnTienda({ ...solicitud, ordenId: origen.ordenId })
        : await responderPresupuestoWeb({ ...solicitud, codigoCliente: origen.codigoCliente });
      if ("error" in resultado) {
        setError(resultado.error);
      } else {
        notificarGuardado(aprobando ? "Presupuesto aprobado" : "Presupuesto rechazado");
        setGuardado(true);
        setDecision(null);
      }
      actualizar(() => router.refresh());
    } catch {
      setError("No se pudo confirmar la respuesta. Inténtalo nuevamente.");
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  function abrir(respuesta: DecisionPresupuesto, boton: HTMLButtonElement) {
    disparador.current = boton;
    setError("");
    setDecision(respuesta);
  }

  return (
    <div className="space-y-3 border-t pt-4">
      {enTienda && <p className="text-sm font-semibold">Respuesta del cliente en tienda</p>}
      {!puedeAprobar && <p className="text-sm text-muted-foreground">El cliente aprueba desde el enlace del ticket.</p>}
      <div className="flex flex-wrap gap-2">
        {puedeAprobar && <Button disabled={ocupado} onClick={(evento) => abrir("APROBAR", evento.currentTarget)}>
          {enTienda ? "Registrar aprobación" : "Aprobar presupuesto"}
        </Button>}
        <Button variant="outline" disabled={ocupado} onClick={(evento) => abrir("RECHAZAR", evento.currentTarget)}>
          {enTienda ? "Registrar rechazo" : "Rechazar presupuesto"}
        </Button>
      </div>

      <Dialog open={decision !== null} onOpenChange={(abierto) => {
        if (!abierto && !pendiente.current) setDecision(null);
      }}>
        <DialogContent showCloseButton={false} finalFocus={disparador}>
          <DialogHeader>
            <DialogTitle>{aprobando ? "Confirmar aprobación" : "Confirmar rechazo"}</DialogTitle>
            <DialogDescription>
              {aprobando
                ? "Se autorizará el trabajo de la versión " + presupuesto.version + " por " + mostrarBs(presupuesto.total ?? "0.00") + "."
                : "Se rechazará la oferta de la versión " + presupuesto.version + ". Recepción podrá coordinar la devolución."}
            </DialogDescription>
          </DialogHeader>
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" disabled={guardando} onClick={() => setDecision(null)}>Volver</Button>
            <Button variant={aprobando ? "default" : "destructive"} disabled={guardando || actualizando}
              onClick={() => void confirmar()}>
              {guardando ? "Registrando…" : aprobando ? "Confirmar aprobación" : "Confirmar rechazo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
