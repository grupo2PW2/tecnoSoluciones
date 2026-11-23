
import { useId } from "react";
import type { ClienteListado } from "../types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CamposCliente({ cliente }: { cliente?: ClienteListado }) {
  const id = useId();
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={id + "-nombre"}>Nombre</Label>
        <Input id={id + "-nombre"} name="nombre" defaultValue={cliente?.nombre ?? ""} required maxLength={100} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id + "-apellido"}>Apellido</Label>
        <Input id={id + "-apellido"} name="apellido" defaultValue={cliente?.apellido ?? ""} required maxLength={100} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id + "-telefono"}>Teléfono (opcional)</Label>
        <Input id={id + "-telefono"} name="telefono" defaultValue={cliente?.telefono ?? ""} type="tel" maxLength={40} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id + "-direccion"}>Dirección (opcional)</Label>
        <Input id={id + "-direccion"} name="direccion" defaultValue={cliente?.direccion ?? ""} maxLength={255} />
      </div>
    </>
  );
}
