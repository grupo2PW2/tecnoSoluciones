"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { calcularPrecioVenta, mostrarImporteExacto } from "@/features/inventario/precios";
import { fechaIngreso } from "@/features/ordenes/modelo";
import { guardarGanancia } from "../actions";

const porcentaje = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });

export function GananciaGlobal({ margen, actualizadoEn }: { margen: string; actualizadoEn: string | null }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [valor, setValor] = useState(margen);
  const [esperado, setEsperado] = useState(margen);
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const ejemplo = calcularPrecioVenta("100.00", valor);
  const sinCambios = actualizadoEn !== null && ejemplo !== null && Number(valor.replace(",", ".")) === Number(esperado);

  function abrir(cambio: boolean) {
    if (pendiente.current) return;
    if (cambio) {
      setValor(margen);
      setEsperado(margen);
      setError("");
    }
    setAbierto(cambio);
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current || ejemplo === null || sinCambios) return;

    pendiente.current = true;
    setGuardando(true);
    setError("");
    try {
      const resultado = await guardarGanancia({ margen: valor, esperado });
      if ("error" in resultado) {
        setError(resultado.error ?? "No se pudo guardar el porcentaje.");
        router.refresh();
      } else {
        setAbierto(false);
        const { actualizados } = resultado;
        notificarGuardado("Porcentaje de ganancia guardado", actualizados === 1
          ? "Se actualizó 1 precio de venta."
          : `Se actualizaron ${actualizados} precios de venta.`);
        router.refresh();
      }
    } catch {
      setError("No se pudo confirmar el guardado. Actualiza la página y revisa el porcentaje vigente.");
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>Ganancia sobre el costo</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <dl className="space-y-2">
          <div>
            <dt className="text-sm text-muted-foreground">Porcentaje vigente</dt>
            <dd className="text-2xl font-semibold">{porcentaje.format(Number(margen))} %</dd>
          </div>
          {actualizadoEn && <div>
            <dt className="text-sm text-muted-foreground">Última modificación</dt>
            <dd className="text-sm">{fechaIngreso(actualizadoEn)}</dd>
          </div>}
        </dl>
        <p className="text-sm text-muted-foreground">
          {actualizadoEn ? "El porcentaje se aplica sobre el costo de referencia de cada repuesto."
            : "La ganancia inicial es de 0 % hasta que guardes un porcentaje."}
        </p>

        <Dialog open={abierto} onOpenChange={abrir}>
          <DialogTrigger render={<Button />}>Editar porcentaje</DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Editar porcentaje de ganancia</DialogTitle>
              <DialogDescription>Al guardar se recalcularán los precios de venta del catálogo.</DialogDescription>
            </DialogHeader>
            <form onSubmit={guardar} className="space-y-4" aria-busy={guardando}>
              <div className="grid gap-2">
                <Label htmlFor="ganancia-porcentaje">Ganancia sobre el costo (%)</Label>
                <Input id="ganancia-porcentaje" inputMode="decimal" maxLength={6} value={valor} disabled={guardando}
                  aria-describedby="ganancia-ayuda" aria-invalid={Boolean(valor) && ejemplo === null}
                  onChange={(evento) => {
                    setValor(evento.target.value);
                    setError("");
                  }} />
                <p id="ganancia-ayuda" className="text-sm text-muted-foreground">Usa un porcentaje entre 0 y 999,99 con hasta dos decimales.</p>
              </div>
              {ejemplo !== null && <p className="rounded-lg bg-muted/50 p-3 text-sm">
                Un repuesto con costo de Bs 100,00 se vendería a <strong>{mostrarImporteExacto(ejemplo)}</strong>.
              </p>}
              {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" disabled={guardando} onClick={() => setAbierto(false)}>Cancelar</Button>
                <Button type="submit" disabled={guardando || ejemplo === null || sinCambios}>
                  {guardando ? "Guardando…" : "Guardar porcentaje"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
