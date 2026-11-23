"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { notificarGuardado, notificarInformacion } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { mostrarExistencias } from "@/lib/existencias";
import { guardarConsumoRepuestos } from "../acciones-consumo-repuestos";
import { consumoRepuestosSchema, type RepuestoAutorizado } from "../consumo-repuestos-modelo";

export function RegistroConsumoRepuestos({ ordenId, repuestos }: { ordenId: number; repuestos: RepuestoAutorizado[] }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [actualizando, actualizar] = useTransition();
  const quedanUnidades = repuestos.some((repuesto) => repuesto.autorizadas > repuesto.utilizadas);
  const hayStock = repuestos.some((repuesto) => repuesto.autorizadas > repuesto.utilizadas && repuesto.stock > 0);
  const motivo = !quedanUnidades ? "Ya registraste todas las unidades aprobadas para esta orden."
    : !hayStock ? "Los repuestos pendientes de registrar están sin stock." : null;

  return (
    <div className="space-y-2">
      <Sheet open={abierto} disablePointerDismissal onOpenChange={(valor) => {
        if (!guardando) {
          setAbierto(valor);
        }
      }}>
        <SheetTrigger render={<Button disabled={Boolean(motivo) || actualizando}
          aria-describedby={motivo ? "consumo-repuestos-bloqueado" : undefined} />}>Registrar repuestos utilizados</SheetTrigger>
        <SheetContent side="right" showCloseButton={false} className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>Registrar repuestos utilizados</SheetTitle>
            <SheetDescription>
              Indica el total usado en esta orden. Si ya registraste 2 unidades y usaste 1 más, ingresa 3 para descontar la diferencia.
            </SheetDescription>
          </SheetHeader>
          {abierto && <Formulario ordenId={ordenId} repuestos={repuestos} guardando={guardando}
            alCambiarGuardado={setGuardando} alCancelar={() => setAbierto(false)}
            alActualizar={() => actualizar(() => router.refresh())}
            alGuardar={(yaRegistrada) => {
              setAbierto(false);
              if (yaRegistrada) notificarInformacion("Esas unidades ya estaban registradas");
              else notificarGuardado("Salida de repuestos registrada");
              actualizar(() => router.refresh());
            }} />}
        </SheetContent>
      </Sheet>
      {motivo && <p id="consumo-repuestos-bloqueado" className="text-sm text-muted-foreground">{motivo}</p>}
    </div>
  );
}

function Formulario({ ordenId, repuestos, guardando, alCambiarGuardado, alGuardar, alCancelar, alActualizar }: {
  ordenId: number;
  repuestos: RepuestoAutorizado[];
  guardando: boolean;
  alCambiarGuardado: (valor: boolean) => void;
  alGuardar: (yaRegistrada: boolean) => void;
  alCancelar: () => void;
  alActualizar: () => void;
}) {
  const [lineas, setLineas] = useState(() => repuestos.filter((repuesto) => repuesto.utilizadas < repuesto.autorizadas)
    .map((repuesto) => ({ ...repuesto, total: String(repuesto.utilizadas) })));
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const stockActual = new Map(repuestos.map((repuesto) => [repuesto.id, repuesto.stock]));
  const formulario = lineas.map((linea) => {
    const total = Number(linea.total);
    const diferencia = total - linea.utilizadas;
    const stock = stockActual.get(linea.id) ?? 0;
    const aviso = linea.total === "" ? "Indica un total en unidades."
      : diferencia < 0 ? "El total debe incluir las unidades ya registradas."
      : total > linea.autorizadas ? "El total supera las unidades aprobadas."
      : diferencia > stock ? "La cantidad por descontar supera el stock." : null;
    return { ...linea, totalUtilizado: total, diferencia, stock, aviso };
  });
  const partidas = formulario.filter((linea) => linea.diferencia > 0).map((linea) => ({
    repuestoId: linea.id, registradas: linea.utilizadas, totalUtilizado: linea.totalUtilizado,
  }));
  const invalido = formulario.some((linea) => linea.aviso);

  async function registrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current || invalido || !partidas.length) return;
    const resultado = consumoRepuestosSchema.safeParse({ ordenId, partidas });
    if (!resultado.success) {
      setError(resultado.error.issues[0].message);
      return;
    }

    pendiente.current = true;
    alCambiarGuardado(true);
    setError("");
    try {
      const respuesta = await guardarConsumoRepuestos(resultado.data);
      if ("error" in respuesta) {
        setError(respuesta.error ?? "No se pudo registrar la salida.");
        alActualizar();
      } else {
        alGuardar(respuesta.yaRegistrada === true);
      }
    } catch {
      setError("No se pudo confirmar la salida. Inténtalo nuevamente.");
    } finally {
      pendiente.current = false;
      alCambiarGuardado(false);
    }
  }

  return (
    <form onSubmit={registrar} className="flex min-h-0 flex-1 flex-col" aria-busy={guardando}>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-5">
        {formulario.map((linea) => {
          const id = "total-utilizado-" + linea.id;
          const avisoId = "aviso-consumo-" + linea.id;
          return (
            <div key={linea.id} className="grid gap-3 rounded-lg border p-3 text-sm sm:grid-cols-[minmax(0,1fr)_10rem]">
              <div className="space-y-1">
                <p className="font-semibold">{linea.nombre}{linea.sku && " · " + linea.sku}</p>
                <p className="text-muted-foreground">Aprobadas: {linea.autorizadas} · Ya registradas: {linea.utilizadas}</p>
                <p className="text-muted-foreground">Stock: {mostrarExistencias(linea)}</p>
              </div>
              <div className="grid gap-1">
                <Label htmlFor={id}>Total utilizado</Label>
                <Input id={id} type="text" inputMode="numeric" maxLength={10} value={linea.total} disabled={guardando}
                  aria-label={"Total utilizado de " + linea.nombre} aria-invalid={Boolean(linea.aviso)}
                  aria-describedby={linea.aviso ? avisoId : undefined}
                  onChange={(evento) => {
                    const valor = evento.target.value;
                    if (/^\d{0,10}$/.test(valor)) {
                      setLineas((actuales) => actuales.map((actual) => actual.id === linea.id ? { ...actual, total: valor } : actual));
                    }
                  }} />
                {linea.aviso ? <p id={avisoId} className="text-xs text-destructive">{linea.aviso}</p>
                  : linea.diferencia > 0 && <p className="text-xs text-muted-foreground">Por descontar: {linea.diferencia}</p>}
              </div>
            </div>
          );
        })}
      </div>
      <SheetFooter className="shrink-0 border-t px-6 sm:flex-row sm:flex-wrap sm:justify-end">
        {error && <p role="alert" className="w-full text-sm text-destructive">{error}</p>}
        {!partidas.length && <p id="consumo-sin-cambios" className="w-full text-sm text-muted-foreground">
          Aumenta el total de al menos un repuesto para registrar una salida.
        </p>}
        {invalido && <p id="consumo-datos-invalidos" className="w-full text-sm text-destructive">
          Corrige las cantidades marcadas para registrar la salida.
        </p>}
        <Button type="button" variant="outline" disabled={guardando} onClick={alCancelar}>Cancelar</Button>
        <Button type="submit" disabled={guardando || invalido || !partidas.length}
          aria-describedby={invalido ? "consumo-datos-invalidos" : !partidas.length ? "consumo-sin-cambios" : undefined}>
          {guardando ? "Registrando…" : "Registrar salida"}
        </Button>
      </SheetFooter>
    </form>
  );
}
