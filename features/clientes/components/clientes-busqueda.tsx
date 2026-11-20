import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Props {
  buscar: string;
}

export function ClientesBusqueda({ buscar }: Props) {
  return (
    <form
      action="/clientes"
      method="GET"
      className="flex flex-wrap items-center gap-2"
    >
      <Input
        type="search"
        name="buscar"
        defaultValue={buscar}
        placeholder="Buscar nombre, apellido o teléfono"
        aria-label="Buscar clientes"
        className="max-w-sm"
      />

      <Button type="submit">Buscar</Button>

      {buscar && (
        <Button variant="outline" render={<Link href="/clientes" />}>
          Limpiar
        </Button>
      )}
    </form>
  );
}
