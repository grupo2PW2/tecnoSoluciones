import { estadosRepuesto, type EstadoRepuesto } from "../modelo";

const estilos = {
  DISPONIBLE: "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200",
  AGOTADO: "bg-amber-500/15 text-amber-900 dark:text-amber-200",
  EN_REPOSICION: "bg-blue-500/15 text-blue-800 dark:text-blue-200",
  DESCATALOGADO: "bg-muted text-muted-foreground",
} satisfies Record<EstadoRepuesto, string>;

export function IndicadorEstadoRepuesto({ estado }: { estado: EstadoRepuesto }) {
  return <span className={"inline-flex rounded-full px-2 py-0.5 text-xs font-semibold " + estilos[estado]}>
    {estadosRepuesto[estado]}
  </span>;
}
