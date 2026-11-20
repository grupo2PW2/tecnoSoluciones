import Link from "next/link";

import { Button } from "@/components/ui/button";

interface Props {
  pagina: number;
  totalPaginas: number;
  total: number;
  buscar: string;
}

export function ClientesPaginacion({
  pagina,
  totalPaginas,
  total,
  buscar,
}: Props) {
  function crearUrl(nuevaPagina: number) {
    const params = new URLSearchParams();

    if (buscar) {
      params.set("buscar", buscar);
    }

    params.set("page", String(nuevaPagina));

    return `/clientes?${params.toString()}`;
  }

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-sm text-muted-foreground">
        {total} clientes · Página {pagina} de {totalPaginas}
      </p>

      <div className="flex gap-2">
        {pagina > 1 && (
          <Button
            variant="outline"
            render={<Link href={crearUrl(pagina - 1)} />}
          >
            Anterior
          </Button>
        )}

        {pagina < totalPaginas && (
          <Button
            variant="outline"
            render={<Link href={crearUrl(pagina + 1)} />}
          >
            Siguiente
          </Button>
        )}
      </div>
    </div>
  );
}