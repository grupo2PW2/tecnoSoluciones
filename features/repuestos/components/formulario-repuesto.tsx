"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SelectorImagen } from "@/features/imagenes/components/selector-imagen";
import { maxUnidadesInventario, type RepuestoInventario } from "@/features/inventario/modelo";
import { guardarRepuesto } from "../acciones";
import { urlImagenRepuesto } from "../imagen";
import { estadosRepuesto, estadoSegunExistencias } from "../modelo";

export function FormularioRepuesto({ repuesto, principal = false }: {
  repuesto?: RepuestoInventario;
  principal?: boolean;
}) {
  const id = useId();
  const titulo = repuesto ? "Editar repuesto" : "Nuevo repuesto";
  const estado = repuesto?.estado;
  const modoEstado = estado === "EN_REPOSICION" || estado === "DESCATALOGADO" ? estado : "SEGUN_EXISTENCIAS";
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current) return;
    const formulario = new FormData(evento.currentTarget);
    pendiente.current = true;
    setGuardando(true);
    setError("");
    try {
      const resultado = await guardarRepuesto(formulario, repuesto?.id);
      if ("error" in resultado) {
        setError(resultado.error ?? "No se pudo guardar el repuesto.");
      } else {
        setAbierto(false);
        const nombre = formulario.get("nombre");
        notificarGuardado(repuesto ? "Repuesto actualizado" : "Repuesto registrado",
          typeof nombre === "string" ? nombre.trim() : undefined);
      }
    } catch {
      setError("No se pudo confirmar el guardado. Inténtalo nuevamente.");
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
      <DialogTrigger render={<Button variant={principal ? "default" : "outline"} size={repuesto ? "sm" : "default"}
        aria-label={repuesto ? "Editar " + repuesto.nombre : undefined} />}>
        {repuesto ? "Editar" : titulo}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{repuesto ? repuesto.nombre + " · " + repuesto.sku : "Crea la ficha del producto para registrar sus próximas entradas."}</DialogDescription>
        </DialogHeader>
        {abierto && <form onSubmit={guardar} className="grid gap-4" aria-busy={guardando}>
          <fieldset disabled={guardando} className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor={id + "-sku"}>Código (SKU)</Label>
              <Input id={id + "-sku"} name="sku" defaultValue={repuesto?.sku} required maxLength={64} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={id + "-nombre"}>Nombre</Label>
              <Input id={id + "-nombre"} name="nombre" defaultValue={repuesto?.nombre} required maxLength={120} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={id + "-unidades-caja"}>Unidades por caja</Label>
              <Input id={id + "-unidades-caja"} name="unidadesCaja" type="number" min={0} max={maxUnidadesInventario}
                step={1} defaultValue={repuesto?.unidadesCaja ?? 0} aria-describedby={id + "-unidades-ayuda"} required />
              <p id={id + "-unidades-ayuda"} className="text-xs text-muted-foreground">
                Usa 0 si el producto se maneja solo por unidades.
                {repuesto && " Las existencias y el mínimo conservan sus cantidades en unidades."}
              </p>
            </div>
            {repuesto && <div className="grid gap-2">
              <Label htmlFor={id + "-estado"}>Estado del repuesto</Label>
              <Select name="modoEstado" defaultValue={modoEstado}>
                <SelectTrigger id={id + "-estado"} className="w-full" aria-describedby={id + "-estado-ayuda"}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SEGUN_EXISTENCIAS">Según existencias · {estadosRepuesto[estadoSegunExistencias(repuesto.stock)]}</SelectItem>
                  <SelectItem value="EN_REPOSICION">En reposición</SelectItem>
                  <SelectItem value="DESCATALOGADO">Descatalogado</SelectItem>
                </SelectContent>
              </Select>
              <p id={id + "-estado-ayuda"} className="text-xs text-muted-foreground">
                En reposición admite entradas y pausa las ventas. Descatalogado bloquea entradas y ventas.
              </p>
            </div>}
            <SelectorImagen src={repuesto ? urlImagenRepuesto(repuesto.id, repuesto.imgUrl) : null} />
          </fieldset>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button variant="outline" type="button" disabled={guardando} onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Guardar repuesto"}</Button>
          </DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  );
}
