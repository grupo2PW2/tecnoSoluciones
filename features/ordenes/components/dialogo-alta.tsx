
"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Props<Opcion> {
  titulo: string;
  descripcion: string;
  guardar: (formulario: FormData) => Promise<{ opcion: Opcion } | { error: string }>;
  alGuardar: (opcion: Opcion) => void;
  disabled?: boolean;
  etiquetaGuardar?: string;
  principal?: boolean;
  children: ReactNode;
}

export function DialogoAlta<Opcion>({
  titulo, descripcion, guardar, alGuardar, disabled, etiquetaGuardar = "Guardar y seleccionar", principal = false, children,
}: Props<Opcion>) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    evento.stopPropagation();
    if (pendiente.current) return;
    const formulario = new FormData(evento.currentTarget);
    pendiente.current = true;
    setGuardando(true);
    setError("");

    try {
      const resultado = await guardar(formulario);
      if ("error" in resultado) {
        setError(resultado.error);
        return;
      }

      alGuardar(resultado.opcion);
      setAbierto(false);
    } catch {
      setError("No se pudo confirmar el registro. Inténtalo nuevamente.");
    } finally {
      pendiente.current = false;
      setGuardando(false);
    }
  }

  return (
    <Dialog open={abierto} onOpenChange={(siguiente) => {
      if (pendiente.current) return;
      setError("");
      setAbierto(siguiente);
    }}>
      <DialogTrigger render={<Button type="button" variant={principal ? "default" : "outline"} disabled={disabled} />}>{titulo}</DialogTrigger>
      <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descripcion}</DialogDescription>
        </DialogHeader>
        <form onSubmit={enviar} className="grid gap-4" aria-busy={guardando}>
          <fieldset disabled={guardando} className="grid gap-3">{children}</fieldset>
          {error && <p role="alert" className="text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={guardando} onClick={() => setAbierto(false)}>Cancelar</Button>
            <Button type="submit" disabled={guardando}>{guardando ? "Guardando…" : etiquetaGuardar}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
