
"use client";

import { useId, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { guardarTrabajoTecnico } from "../acciones-ejecucion";
import { puedeEjecutarReparacion, trabajoCompleto, trabajoPuedeIniciar, type TrabajoAutorizado } from "../ejecucion-modelo";
import { ejecucionSchema, type SolicitudEjecucion } from "../ejecucion-schemas";
import { fechaIngreso, type EstadoOrden } from "../modelo";

const estadosTrabajo = {
  PRESUPUESTADO: ["Pendiente de iniciar", "bg-muted text-foreground"],
  PENDIENTE_EJECUCION: ["Pendiente de iniciar", "bg-muted text-foreground"],
  EN_PROCESO: ["En proceso", "bg-violet-500/15 text-violet-800 dark:text-violet-200"],
  FINALIZADO: ["Finalizado", "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200"],
  CANCELADO: ["Cancelado", "bg-red-500/15 text-red-800 dark:text-red-200"],
} as const;

const avisosTrabajo: Record<SolicitudEjecucion["operacion"], string> = {
  iniciar: "Servicio iniciado",
  guardar: "Avance guardado",
  finalizar: "Servicio verificado y finalizado",
  listo: "Orden lista para entrega",
};

function useGuardarTrabajo() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);
  const [actualizando, actualizar] = useTransition();
  const [error, setError] = useState("");
  const pendiente = useRef(false);

  async function ejecutar(solicitud: SolicitudEjecucion) {
    if (pendiente.current) return false;
    setError("");

    const validada = ejecucionSchema.safeParse(solicitud);
    if (!validada.success) {
      setError(validada.error.issues[0].message);
      return false;
    }

    pendiente.current = true;
    setGuardando(true);
    try {
      const resultado = await guardarTrabajoTecnico(validada.data);
      if ("error" in resultado) {
        setError(resultado.error ?? "No se pudo guardar el trabajo.");
        return false;
      }
      notificarGuardado(avisosTrabajo[solicitud.operacion]);
      actualizar(() => router.refresh());
      return true;
    } catch {
      setError("No se pudo confirmar el guardado. Inténtalo nuevamente.");
      return false;
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  return { ejecutar, error, limpiarError: () => setError(""), ocupado: guardando || actualizando };
}

export function EjecucionOrden({ ordenId, estado, cerrado, trabajos }: {
  ordenId: number; estado: EstadoOrden; cerrado: boolean; trabajos: TrabajoAutorizado[];
}) {
  const editable = puedeEjecutarReparacion(estado, cerrado);
  const reparaciones = trabajos.filter((trabajo) => !trabajo.esDiagnostico);
  const verificados = reparaciones.filter(trabajoCompleto).length;
  const puedeCerrar = trabajos.length > 0 && trabajos.every(trabajoCompleto);

  return (
    <Card>
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Trabajo autorizado</h2>
          {reparaciones.length > 0 && <p className="text-sm text-muted-foreground">
            {verificados} de {reparaciones.length} servicios verificados
          </p>}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {reparaciones.length ? (
          <ul className="grid gap-3">
            {reparaciones.map((trabajo) => <li key={trabajo.presupuestoId + ":" + trabajo.servicioId}>
              <FichaTrabajo ordenId={ordenId} trabajo={trabajo} editable={editable} />
            </li>)}
          </ul>
        ) : <p className="rounded-lg border p-4 text-sm text-muted-foreground">No hay servicios autorizados en esta orden.</p>}

        {editable && <CierreTecnico ordenId={ordenId} puedeCerrar={puedeCerrar} />}
        {estado === "LISTO" && cerrado && <p className="rounded-lg border p-4 text-sm">El trabajo está verificado y la orden está lista para entrega.</p>}
      </CardContent>
    </Card>
  );
}

function FichaTrabajo({ ordenId, trabajo, editable }: { ordenId: number; trabajo: TrabajoAutorizado; editable: boolean }) {
  const id = useId();
  const [observaciones, setObservaciones] = useState(trabajo.observaciones ?? "");
  const [confirmar, setConfirmar] = useState(false);
  const { ejecutar, error, limpiarError, ocupado } = useGuardarTrabajo();
  const identificacion = { ordenId, presupuestoId: trabajo.presupuestoId, servicioId: trabajo.servicioId };
  const enProceso = editable && !trabajo.esDiagnostico && trabajo.estado === "EN_PROCESO";
  const [estado, color] = estadosTrabajo[trabajo.estado];

  async function finalizar() {
    if (await ejecutar({ ...identificacion, operacion: "finalizar", observaciones, verificado: true })) setConfirmar(false);
  }

  return (
    <article className="space-y-3 rounded-lg border p-4 text-sm" aria-busy={ocupado}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="break-words font-semibold">{trabajo.nombre}</h3>
          <p className="text-muted-foreground">Cantidad {trabajo.cantidad}{trabajo.version !== null && " · Versión " + trabajo.version}</p>
        </div>
        <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + color}>{estado}</span>
      </div>

      {(trabajo.fechaInicio || trabajo.fechaFinalizacion) && <dl className="grid gap-2 sm:grid-cols-2">
        {trabajo.fechaInicio && <div><dt className="font-medium">Inicio</dt><dd>{fechaIngreso(trabajo.fechaInicio)}</dd></div>}
        {trabajo.fechaFinalizacion && <div><dt className="font-medium">Finalización</dt><dd>{fechaIngreso(trabajo.fechaFinalizacion)}</dd></div>}
      </dl>}

      {trabajoCompleto(trabajo) && <p>Verificado</p>}
      {!enProceso && trabajo.observaciones && <p className="whitespace-pre-wrap break-words">{trabajo.observaciones}</p>}

      {editable && trabajoPuedeIniciar(trabajo) && (
        <Button size="sm" disabled={ocupado} aria-label={"Iniciar servicio " + trabajo.nombre}
          onClick={() => void ejecutar({ ...identificacion, operacion: "iniciar" })}>
          {ocupado ? "Iniciando…" : "Iniciar servicio"}
        </Button>
      )}

      {enProceso && <>
        <div className="grid gap-2">
          <Label htmlFor={id}>Trabajo realizado y resultado de la prueba</Label>
          <Textarea id={id} rows={3} maxLength={4000} value={observaciones} disabled={ocupado}
            onChange={(evento) => setObservaciones(evento.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={ocupado} onClick={() => void ejecutar({ ...identificacion, operacion: "guardar", observaciones })}>Guardar avance</Button>
          <ConfirmarTrabajo abierto={confirmar} cambiarAbierto={(valor) => {
            if (valor) limpiarError();
            setConfirmar(valor);
          }}
            titulo="Finalizar servicio" descripcion={"Confirma que probaste el resultado de " + trabajo.nombre + " y que verificaste el trabajo."}
            texto="Finalizar servicio" textoAccion="Verificar y finalizar"
            error={error} ocupado={ocupado} bloqueado={!observaciones.trim()}
            confirmar={() => void finalizar()} />
        </div>
        {!observaciones.trim() && <p className="text-muted-foreground">Registra el resultado de la prueba antes de finalizar.</p>}
      </>}

      {error && !confirmar && <p role="alert" className="text-destructive">{error}</p>}
    </article>
  );
}

function CierreTecnico({ ordenId, puedeCerrar }: { ordenId: number; puedeCerrar: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const { ejecutar, error, limpiarError, ocupado } = useGuardarTrabajo();

  async function cerrar() {
    if (await ejecutar({ ordenId, operacion: "listo" })) setAbierto(false);
  }

  const texto = "Dejar lista para entrega";
  return (
    <div className="space-y-2 border-t pt-4">
      {!puedeCerrar && <p className="text-sm text-muted-foreground">
        Finaliza y verifica todos los servicios autorizados antes de dejar la orden lista para entrega.
      </p>}
      <ConfirmarTrabajo abierto={abierto} cambiarAbierto={(valor) => {
        if (valor) limpiarError();
        setAbierto(valor);
      }} titulo={texto}
        descripcion="Se cerrará el trabajo técnico y se liberará el cupo de esta orden."
        texto={texto} textoAccion="Confirmar cierre técnico"
        ocupado={ocupado} bloqueado={!puedeCerrar} error={error}
        confirmar={() => void cerrar()} />
      {error && !abierto && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

function ConfirmarTrabajo({ abierto, cambiarAbierto, titulo, descripcion, texto, textoAccion,
  ocupado, bloqueado, error, confirmar }: {
  abierto: boolean;
  cambiarAbierto: (abierto: boolean) => void;
  titulo: string;
  descripcion: string;
  texto: string;
  textoAccion: string;
  ocupado: boolean;
  bloqueado: boolean;
  error: string;
  confirmar: () => void;
}) {
  return (
    <Dialog open={abierto} onOpenChange={(valor) => { if (!ocupado) cambiarAbierto(valor); }}>
      <DialogTrigger render={<Button disabled={ocupado || bloqueado} />}>{texto}</DialogTrigger>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        <DialogFooter>
          <Button variant="outline" disabled={ocupado} onClick={() => cambiarAbierto(false)}>Volver</Button>
          <Button disabled={ocupado || bloqueado} onClick={confirmar}>
            {ocupado ? "Guardando…" : textoAccion}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
