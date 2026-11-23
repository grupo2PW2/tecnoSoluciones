
"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { guardarDiagnostico } from "../acciones-diagnostico";
import type { DatosDetalleTecnico } from "../detalle-tecnico";
import { nombreDiagnosticoGeneral, type OperacionDiagnostico } from "../diagnostico-general";
import { fechaIngreso } from "../modelo";
import { diagnosticoSchema } from "../schemas";

const formatoImporte = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function DiagnosticoOrden({ orden }: { orden: Pick<DatosDetalleTecnico,
  "id" | "tipoIngreso" | "estado" | "fechaCierreTecnico" | "diagnostico" | "tarifaDiagnostico"
> }) {
  const [hallazgos, setHallazgos] = useState(orden.diagnostico?.observaciones ?? "");
  const [confirmar, setConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [recargando, actualizarVista] = useTransition();
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const router = useRouter();

  const linea = orden.diagnostico;
  const finalizado = linea?.estado === "FINALIZADO";
  const iniciado = linea?.estado === "EN_PROCESO";
  const puedeTrabajar = orden.tipoIngreso === "DIAGNOSTICO" && !orden.fechaCierreTecnico;
  const editable = puedeTrabajar && iniciado && linea.presupuesto?.estado === "BORRADOR" &&
    orden.estado === "EN_DIAGNOSTICO";
  const porIniciar = puedeTrabajar && (orden.estado === "RECIBIDO" || orden.estado === "EN_DIAGNOSTICO") &&
    (!linea || (linea.presupuesto?.estado === "BORRADOR" &&
      (linea.estado === "PRESUPUESTADO" || linea.estado === "PENDIENTE_EJECUCION")));
  const ocupado = guardando || recargando;
  const tarifa = orden.tarifaDiagnostico;

  async function ejecutar(operacion: OperacionDiagnostico) {
    if (pendiente.current) return;
    const resultado = diagnosticoSchema.safeParse({
      ordenId: orden.id,
      operacion,
      hallazgos,
      verificado: operacion === "finalizar" && confirmar,
    });
    if (!resultado.success) {
      setError(resultado.error.issues[0].message);
      return;
    }

    pendiente.current = true;
    setGuardando(true);
    setError("");

    try {
      const respuesta = await guardarDiagnostico(resultado.data);
      if ("error" in respuesta) {
        setError(respuesta.error ?? "No se pudo guardar el diagnóstico.");
        return;
      }

      setConfirmar(false);
      notificarGuardado(operacion === "iniciar" ? "Diagnóstico iniciado"
        : operacion === "finalizar" ? "Diagnóstico finalizado" : "Hallazgos guardados");
      actualizarVista(() => router.refresh());
    } catch {
      setError("No se pudo confirmar el guardado. Inténtalo nuevamente.");
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  return (
    <Card aria-busy={ocupado}>
      <CardHeader><CardTitle>{nombreDiagnosticoGeneral}</CardTitle></CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className={"rounded-full px-2 py-0.5 font-semibold " +
            (finalizado ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"
              : iniciado ? "bg-violet-500/15 text-violet-800 dark:text-violet-200" : "bg-muted")}>
            {finalizado ? "Finalizado" : iniciado ? "En proceso" : linea?.estado === "CANCELADO" ? "Cancelado" : "Sin iniciar"}
          </span>
          {tarifa !== null && <span className="font-medium">Tarifa · Bs {formatoImporte.format(Number(tarifa))}</span>}
        </div>

        {linea?.fechaInicio && <p><strong>Inicio</strong> · {fechaIngreso(linea.fechaInicio)}</p>}
        {linea?.fechaFinalizacion && <p><strong>Finalización</strong> · {fechaIngreso(linea.fechaFinalizacion)}</p>}

        {porIniciar && (tarifa === null
          ? <p className="text-muted-foreground">Administración debe habilitar el servicio de diagnóstico para que puedas iniciarlo.</p>
          : <Button disabled={ocupado} onClick={() => void ejecutar("iniciar")}>
              {ocupado ? "Iniciando…" : "Iniciar diagnóstico"}
            </Button>
        )}
        {!linea && !porIniciar && <p className="text-muted-foreground">
          {orden.tipoIngreso === "SERVICIO_DIRECTO" ? "Este ingreso corresponde a un servicio directo."
            : !orden.tipoIngreso ? "Falta clasificar el tipo de ingreso en esta orden."
              : "El estado de esta orden no permite iniciar el diagnóstico."}
        </p>}

        {editable ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="hallazgos-diagnostico">Hallazgos</Label>
              <Textarea id="hallazgos-diagnostico" rows={5} maxLength={4000} value={hallazgos} disabled={ocupado}
                onChange={(evento) => setHallazgos(evento.target.value)} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={ocupado} onClick={() => void ejecutar("guardar")}>Guardar hallazgos</Button>
              <Dialog open={confirmar} onOpenChange={(abierto) => {
                if (!pendiente.current) {
                  if (abierto) setError("");
                  setConfirmar(abierto);
                }
              }}>
                <DialogTrigger render={<Button disabled={ocupado || !hallazgos.trim()} />}>Finalizar diagnóstico</DialogTrigger>
                <DialogContent showCloseButton={false}>
                  <DialogHeader>
                    <DialogTitle>Finalizar diagnóstico</DialogTitle>
                    <DialogDescription>Confirma que revisaste y verificaste los hallazgos. Se guardarán como parte del diagnóstico finalizado.</DialogDescription>
                  </DialogHeader>
                  {error && <p role="alert" className="text-destructive">{error}</p>}
                  <DialogFooter>
                    <Button variant="outline" disabled={ocupado} onClick={() => setConfirmar(false)}>Volver</Button>
                    <Button disabled={ocupado} onClick={() => void ejecutar("finalizar")}>
                      {ocupado ? "Guardando…" : "Verificar y finalizar"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            {!hallazgos.trim() && <p className="text-muted-foreground">Escribe los hallazgos antes de finalizar.</p>}
          </div>
        ) : (
          linea?.observaciones && <div>
            <p className="font-semibold">Hallazgos</p>
            <p className="whitespace-pre-wrap break-words">{linea.observaciones}</p>
          </div>
        )}

        {iniciado && !editable && <p className="text-muted-foreground">El estado de la orden impide editar los hallazgos.</p>}
        {finalizado && linea.trabajoVerificado && <p>Hallazgos verificados.</p>}
        {finalizado && orden.estado === "EN_DIAGNOSTICO" && <p className="text-muted-foreground">Pendiente de cotización.</p>}
        {error && !confirmar && <p role="alert" className="text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}
