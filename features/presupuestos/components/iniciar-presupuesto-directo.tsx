"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { iniciarPresupuestoDirecto } from "../actions";

export function IniciarPresupuestoDirecto({ ordenId }: { ordenId: number }) {
  const router = useRouter();
  const [pendiente, iniciar] = useTransition();
  const [error, setError] = useState("");
  const [creado, setCreado] = useState(false);
  const enCurso = useRef(false);

  function crear() {
    if (enCurso.current || creado) return;
    enCurso.current = true;
    setError("");
    iniciar(async () => {
      try {
        const resultado = await iniciarPresupuestoDirecto(ordenId);
        if ("error" in resultado) {
          setError(resultado.error ?? "No se pudo crear el borrador.");
        } else {
          notificarGuardado("Borrador de presupuesto creado");
          setCreado(true);
          router.refresh();
        }
      } catch {
        setError("No se pudo iniciar la cotización. Inténtalo nuevamente.");
      } finally {
        enCurso.current = false;
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <h2 className="text-lg font-semibold">Presupuesto de servicio directo</h2>
        <Button disabled={pendiente || creado} onClick={crear}>{pendiente || creado ? "Creando borrador…" : "Crear presupuesto"}</Button>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
