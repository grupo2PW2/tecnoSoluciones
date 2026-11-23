
import { useId } from "react";
import type { EquipoFicha } from "../queries";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { tiposDispositivo } from "../modelo";

export function CamposEquipo({ equipo }: { equipo?: EquipoFicha }) {
  const id = useId();
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={id + "-tipo"}>Tipo de equipo</Label>
        <Select name="tipo" defaultValue={equipo?.tipo ?? "OTRO"} items={tiposDispositivo} required>
          <SelectTrigger id={id + "-tipo"} className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(tiposDispositivo).map(([valor, etiqueta]) => (
              <SelectItem key={valor} value={valor}>{etiqueta}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id + "-marca"}>Marca</Label>
        <Input id={id + "-marca"} name="marca" defaultValue={equipo?.marca ?? ""} required maxLength={100} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id + "-modelo"}>Modelo</Label>
        <Input id={id + "-modelo"} name="modelo" defaultValue={equipo?.modelo ?? ""} required maxLength={100} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id + "-serie"}>Número de serie (opcional)</Label>
        <Input id={id + "-serie"} name="nroSerie" defaultValue={equipo?.nroSerie ?? ""} maxLength={100} />
      </div>
    </>
  );
}
