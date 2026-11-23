"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { esTipoImagen, formatosImagen, limiteImagen } from "../modelo";
import { MiniaturaImagen } from "./miniatura-imagen";

export function SelectorImagen({ src }: { src: string | null }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const temporal = useRef<string | null>(null);
  const [nueva, setNueva] = useState<string | null>(null);
  const [quitar, setQuitar] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => () => {
    if (temporal.current) URL.revokeObjectURL(temporal.current);
  }, []);

  function seleccionar(archivo: File | undefined) {
    if (temporal.current) URL.revokeObjectURL(temporal.current);
    temporal.current = null;
    const problema = archivo && (archivo.size > limiteImagen
      ? "La imagen debe pesar como máximo 3 MB."
      : !esTipoImagen(archivo.type) ? "Selecciona un archivo JPEG, PNG o WebP." : "");
    input.current?.setCustomValidity(problema ?? "");
    setError(problema ?? "");
    if (archivo && !problema) {
      temporal.current = URL.createObjectURL(archivo);
      setQuitar(false);
    }
    setNueva(temporal.current);
  }

  return <div className="grid gap-2">
    <Label htmlFor={id}>Imagen (opcional)</Label>
    <div className="flex items-start gap-3">
      <MiniaturaImagen src={nueva ?? (quitar ? null : src)} alt="Vista previa de la imagen" tamano={64} />
      <div className="grid min-w-0 flex-1 gap-2">
        <Input ref={input} id={id} name={nueva ? "imagen" : undefined} type="file" accept={Object.keys(formatosImagen).join(",")}
          aria-describedby={id + "-ayuda"} aria-invalid={error ? true : undefined}
          onChange={(evento) => seleccionar(evento.target.files?.[0])} />
        <p id={id + "-ayuda"} className="text-xs text-muted-foreground">JPEG, PNG o WebP de hasta 3 MB.</p>
        {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
      </div>
    </div>
    {quitar && <input type="hidden" name="quitarImagen" value="true" />}
    {(nueva || error) ? <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => {
      if (input.current) input.current.value = "";
      seleccionar(undefined);
    }}>Descartar archivo</Button>
      : src && <Button type="button" variant="outline" size="sm" className="w-fit" onClick={() => setQuitar(!quitar)}>
        {quitar ? "Conservar imagen" : "Quitar imagen"}
      </Button>}
  </div>;
}
