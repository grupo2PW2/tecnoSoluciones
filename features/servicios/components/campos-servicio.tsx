
import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function CamposServicio({ valores, nombreReservado = false }: {
  valores?: { nombre: string; precioReferencial: string; descripcion: string | null };
  nombreReservado?: boolean;
}) {
  const id = useId();

  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={id + "-nombre"}>Nombre</Label>
        <Input id={id + "-nombre"} name="nombre" defaultValue={valores?.nombre} readOnly={nombreReservado} required maxLength={120} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id + "-precio"}>Tarifa de referencia (Bs)</Label>
        <Input id={id + "-precio"} name="precio" defaultValue={valores?.precioReferencial} inputMode="decimal" required maxLength={11} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor={id + "-descripcion"}>Descripción (opcional)</Label>
        <Textarea id={id + "-descripcion"} name="descripcion" defaultValue={valores?.descripcion ?? ""} rows={2} maxLength={500} />
      </div>
    </>
  );
}
