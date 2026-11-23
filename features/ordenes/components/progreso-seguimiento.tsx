import { CheckIcon } from "lucide-react";
import type { EstadoOrden } from "../modelo";

const titulos = {
  ingreso: "Recibido",
  diagnostico: "Diagnóstico",
  presupuesto: "Presupuesto",
  reparacion: "En reparación",
  listo: "Listo para recoger",
  entrega: "Entregado",
  cancelacion: "Cancelación",
  devolucion: "Devolución",
};

type Etapa = keyof typeof titulos;

const etapaPorEstado: Record<EstadoOrden, Etapa> = {
  RECIBIDO: "ingreso",
  EN_DIAGNOSTICO: "diagnostico",
  PENDIENTE_APROBACION: "presupuesto",
  APROBADO: "presupuesto",
  EN_REPARACION: "reparacion",
  LISTO: "listo",
  ENTREGADO: "entrega",
  RECHAZADO: "devolucion",
  RECHAZADO_ENTREGADO: "devolucion",
  CANCELADO: "cancelacion",
};

export function ProgresoSeguimiento({ estado, servicioDirecto, devuelta }: {
  estado: EstadoOrden; servicioDirecto: boolean; devuelta: boolean;
}) {
  const recorrido: Etapa[] = servicioDirecto ? ["ingreso", "presupuesto"] : ["ingreso", "diagnostico", "presupuesto"];
  const etapas: Etapa[] = estado === "CANCELADO" ? ["ingreso", "cancelacion", "devolucion"]
    : estado === "RECHAZADO" || estado === "RECHAZADO_ENTREGADO"
      ? [...recorrido, "devolucion"] : [...recorrido, "reparacion", "listo", "entrega"];
  const etapa = estado === "CANCELADO" && devuelta ? "devolucion" : etapaPorEstado[estado];
  const indiceActual = Math.max(0, etapas.indexOf(etapa));
  const finalizado = estado === "ENTREGADO" || estado === "RECHAZADO_ENTREGADO" || (estado === "CANCELADO" && devuelta);

  return <section aria-labelledby="progreso-orden" className="space-y-3 rounded-lg border p-4">
    <h2 id="progreso-orden" className="text-sm font-semibold">Avance de tu orden</h2>
    <ol className="flex flex-col gap-2 sm:flex-row sm:gap-1.5">
      {etapas.map((paso, indice) => {
        const actual = indice === indiceActual;
        const completa = indice < indiceActual || (actual && finalizado);
        const color = actual ? "border-primary bg-primary/10 text-primary"
          : completa ? "border-emerald-500/35 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200"
          : "border-border bg-muted text-muted-foreground";
        return <li key={paso} aria-current={actual ? "step" : undefined}
          className="relative flex min-w-0 items-center gap-2 sm:flex-1 sm:flex-col sm:items-start">
          {indice < etapas.length - 1 && <span aria-hidden="true"
            className={"absolute top-3.5 left-8 hidden h-px w-[calc(100%-1.75rem)] sm:block " +
              (indice < indiceActual ? "bg-emerald-500/50" : "bg-border")} />}
          <span aria-hidden="true" className={"z-0 grid size-7 shrink-0 place-items-center rounded-full border text-xs font-semibold " + color}>
            {completa ? <CheckIcon className="size-4" /> : indice + 1}
          </span>
          <span className={"text-xs " + (actual ? "font-bold text-foreground" : "font-medium text-muted-foreground")}>
            {paso === "devolucion" && finalizado ? "Devuelto" : titulos[paso]}
            <span className="sr-only">{completa ? " · Completado" : actual ? " · Etapa actual" : " · Pendiente"}</span>
          </span>
        </li>;
      })}
    </ol>
  </section>;
}
