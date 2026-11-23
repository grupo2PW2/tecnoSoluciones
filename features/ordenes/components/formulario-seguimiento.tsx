"use client";

import { useActionState, useState } from "react";
import { ArrowRightIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { consultarOrdenPublica } from "../consulta-publica";

export function FormularioSeguimiento() {
  const [codigo, setCodigo] = useState("");
  const [codigoEnviado, setCodigoEnviado] = useState("");
  const [estado, consultar, pendiente] = useActionState(consultarOrdenPublica, { error: "" });

  const error = !pendiente && codigo === codigoEnviado ? estado.error : "";

  return <form action={consultar} onSubmit={() => setCodigoEnviado(codigo)} className="space-y-4" aria-busy={pendiente}>
    <div className="space-y-2">
      <Label htmlFor="codigo-consulta" className="text-base font-bold">Código de consulta</Label>
      <Input id="codigo-consulta" name="codigo" value={codigo} onChange={(evento) => setCodigo(evento.target.value)}
        placeholder="Escribe o pega el código" maxLength={128} autoComplete="off" autoCapitalize="none" spellCheck={false}
        readOnly={pendiente} required aria-invalid={Boolean(error)}
        aria-describedby={error ? "ayuda-codigo error-codigo" : "ayuda-codigo"}
        className="h-12 scroll-mt-16 border-slate-300 bg-background px-3 text-base focus-visible:border-blue-600 focus-visible:ring-blue-500/35 dark:border-slate-700" />
      <p id="ayuda-codigo" className="text-sm text-muted-foreground">Es el código que aparece en tu ticket de ingreso.</p>
      {error && <p id="error-codigo" role="alert" className="text-sm font-medium text-destructive">{error}</p>}
    </div>
    <Button type="submit" size="lg" className="h-12 w-full gap-2 bg-blue-700 text-base font-bold text-white hover:bg-blue-800 focus-visible:ring-blue-500/55" disabled={pendiente}>
      {pendiente ? <>Consultando… <LoaderCircleIcon className="motion-safe:animate-spin" aria-hidden="true" /></>
        : <>Ver mi orden <ArrowRightIcon aria-hidden="true" /></>}
    </Button>
  </form>;
}
