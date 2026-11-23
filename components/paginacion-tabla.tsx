import { Button } from "@/components/ui/button";

export function PaginacionTabla({ pagina, totalPaginas, total, unidad, deshabilitada, cambiarPagina }: {
  pagina: number;
  totalPaginas: number;
  total: number;
  unidad: string;
  deshabilitada?: boolean;
  cambiarPagina: (pagina: number) => void;
}) {
  if (total === 0) return null;

  return (
    <nav aria-label="Paginación de resultados" className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">{total} {total === 1 ? unidad : unidad + "s"} · Página {pagina} de {totalPaginas}</p>
      {totalPaginas > 1 && <div className="flex gap-2">
        <Button variant="outline" disabled={deshabilitada || pagina <= 1} onClick={() => cambiarPagina(pagina - 1)}>Anterior</Button>
        <Button variant="outline" disabled={deshabilitada || pagina >= totalPaginas} onClick={() => cambiarPagina(pagina + 1)}>Siguiente</Button>
      </div>}
    </nav>
  );
}
