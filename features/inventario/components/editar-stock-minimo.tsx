"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mostrarCajasYUnidades, mostrarUnidades } from "@/lib/existencias";
import { guardarStockMinimo } from "../actions";
import { calcularUnidadesMovimiento, maxUnidadesInventario, type RepuestoInventario } from "../modelo";

export function EditarStockMinimo({ repuesto }: { repuesto: RepuestoInventario }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [cajas, setCajas] = useState("0");
  const [unidades, setUnidades] = useState("0");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const { unidadesCaja } = repuesto;
  const porCaja = unidadesCaja > 0;
  const cantidadCajas = porCaja ? Number(cajas) : 0;
  const total = (!porCaja || /^\d+$/.test(cajas)) && /^\d+$/.test(unidades)
    ? calcularUnidadesMovimiento(cantidadCajas, Number(unidades), unidadesCaja)
    : null;

  function cambiarApertura(valor: boolean) {
    if (pendiente.current) return;
    if (valor) {
      setCajas(porCaja ? String(Math.floor(repuesto.stockMinimo / unidadesCaja)) : "0");
      setUnidades(String(porCaja ? repuesto.stockMinimo % unidadesCaja : repuesto.stockMinimo));
      setError("");
    }
    setAbierto(valor);
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current || total === null) return;
    pendiente.current = true;
    setGuardando(true);
    setError("");
    try {
      const resultado = await guardarStockMinimo({
        repuestoId: repuesto.id, cajas: cantidadCajas, unidades: Number(unidades), unidadesCaja,
      });
      if ("error" in resultado) {
        setError(resultado.error ?? "No se pudo guardar el stock mínimo.");
        return;
      }
      setAbierto(false);
      notificarGuardado("Stock mínimo guardado", repuesto.nombre);
    } catch {
      setError("No se pudo confirmar el guardado. Inténtalo nuevamente.");
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={cambiarApertura}>
      <DialogTrigger render={<Button variant="outline" size="sm" aria-label={"Editar mínimo de " + repuesto.nombre} />}>
        Editar mínimo
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar stock mínimo</DialogTitle>
          <DialogDescription>{repuesto.nombre} · {repuesto.sku}</DialogDescription>
        </DialogHeader>
        {abierto && <form className="grid gap-4" onSubmit={guardar} aria-busy={guardando}>
          <p className="text-muted-foreground">
            Existencias actuales · <strong className="text-foreground">{mostrarCajasYUnidades(repuesto)}</strong>
          </p>
          <fieldset disabled={guardando} className={porCaja ? "grid grid-cols-2 gap-3" : "grid gap-3"}>
            {porCaja && <div className="grid gap-2">
              <Label htmlFor={id + "-cajas"}>Cajas de {mostrarUnidades(unidadesCaja)}</Label>
              <Input id={id + "-cajas"} type="number" min={0} max={maxUnidadesInventario} step={1}
                value={cajas} onChange={(evento) => setCajas(evento.target.value)} required />
            </div>}
            <div className="grid gap-2">
              <Label htmlFor={id + "-unidades"}>{porCaja ? "Unidades sueltas" : "Unidades"}</Label>
              <Input id={id + "-unidades"} type="number" min={0} max={maxUnidadesInventario} step={1}
                value={unidades} onChange={(evento) => setUnidades(evento.target.value)} required />
            </div>
          </fieldset>
          <div className="rounded-lg bg-muted p-3">
            {total === null
              ? <p role="status" className="text-destructive">Indica cantidades enteras dentro del rango permitido.</p>
              : <>
                <p role="status" className="font-semibold tabular-nums">Mínimo · {mostrarUnidades(total)}</p>
                <p className="text-xs text-muted-foreground">Usa 0 para quitar el mínimo.</p>
              </>}
          </div>
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" type="button" disabled={guardando} onClick={() => cambiarApertura(false)}>Cancelar</Button>
            <Button type="submit" disabled={guardando || total === null}>{guardando ? "Guardando…" : "Guardar mínimo"}</Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  );
}
