
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { prepararNuevaVersion } from "../acciones-renovacion";

export function PrepararNuevaOferta({ ordenId, presupuestoId, version, desdeRetirada }: {
  ordenId: number; presupuestoId: number; version: number; desdeRetirada: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [creada, setCreada] = useState(false);
  const [actualizando, actualizar] = useTransition();
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const titulo = desdeRetirada ? "Preparar nueva versión" : "Renovar presupuesto";
  const ocupado = guardando || actualizando || creada;

  async function preparar() {
    if (pendiente.current) return;
    pendiente.current = true;
    setGuardando(true);
    setError("");

    try {
      const resultado = await prepararNuevaVersion({ ordenId, presupuestoId, desdeRetirada });
      if ("error" in resultado) {
        setError(resultado.error ?? "No se pudo crear el borrador.");
      } else {
        notificarGuardado(desdeRetirada ? "Borrador corregido creado" : "Borrador de renovación creado");
        setCreada(true);
        setAbierto(false);
      }
      actualizar(() => router.refresh());
    } catch {
      setError("No se pudo preparar la versión. Inténtalo nuevamente.");
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
      <DialogTrigger render={<Button disabled={ocupado} />}>{titulo}</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            {desdeRetirada
              ? `La versión ${version} quedará en el historial. El borrador conservará los precios ofrecidos de los servicios activos y los repuestos. Revisa las existencias y las fechas antes de presentar.`
              : `La versión ${version} quedará en el historial. El borrador usará las tarifas vigentes de los servicios activos y los repuestos. El diagnóstico conservará su importe. Revisa las existencias e indica nuevas fechas antes de presentar.`}
          </DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={ocupado} onClick={() => setAbierto(false)}>Volver</Button>
          <Button disabled={ocupado} onClick={() => void preparar()}>
            {guardando ? "Preparando…" : desdeRetirada ? "Crear borrador corregido" : "Crear borrador de renovación"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
