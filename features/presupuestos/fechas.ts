
const formatoFecha = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "America/La_Paz",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function fechaBolivia(fecha: Date = new Date()) {
  return formatoFecha.format(fecha);
}

export function fechaEstimadaLocal(dia: string) {
  return new Date(dia + "T00:00:00.000-04:00");
}

export function vencimientoLocal(dia: string) {
  return new Date(dia + "T23:59:59.999-04:00");
}

export function mostrarDia(dia: string) {
  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium", timeZone: "America/La_Paz",
  }).format(fechaEstimadaLocal(dia));
}
