
export const recargosPrioridad = {
  BAJA: 0,
  MEDIA: 5,
  ALTA: 10,
} as const;

export type PrioridadPresupuesto = keyof typeof recargosPrioridad;

export interface PartidaValorizada {
  cantidad: number;
  precioUnitario: string;
}

const cien = BigInt(100);
const cincuenta = BigInt(50);
const dos = BigInt(2);
const maximoImporte = BigInt("9999999999");

export function sumarImportesRegistrados(importes: readonly string[]): string | null {
  if (importes.some((importe) => !/^\d{1,8}(\.\d{1,2})?$/.test(importe))) return null;
  const total = importes.reduce((saldo, importe) => saldo + aCentavos(importe), BigInt(0));
  return total > maximoImporte ? null : aDecimal(total);
}

function aCentavos(decimal: string) {
  const [entero, fraccion = ""] = decimal.split(".");
  return BigInt(entero + fraccion.padEnd(2, "0"));
}

function aDecimal(centavos: bigint) {
  const unidades = centavos / cien;
  const fraccion = centavos % cien;
  return String(unidades) + "." + String(fraccion).padStart(2, "0");
}

function sumarPartidas(partidas: readonly PartidaValorizada[]) {
  return partidas.reduce((total, partida) =>
    total + BigInt(partida.cantidad) * aCentavos(partida.precioUnitario), BigInt(0));
}

export function importePartida(partida: PartidaValorizada) {
  return aDecimal(sumarPartidas([partida]));
}

export function calcularPresupuesto(
  servicios: readonly PartidaValorizada[],
  repuestos: readonly PartidaValorizada[],
  tarifaDiagnostico: string,
  prioridad: PrioridadPresupuesto,
) {
  const manoDeObra = sumarPartidas(servicios);
  const subtotalRepuestos = sumarPartidas(repuestos);
  const diagnostico = aCentavos(tarifaDiagnostico);
  const subtotalServicios = manoDeObra + diagnostico;
  const porcentaje = recargosPrioridad[prioridad];
  const recargo = ((manoDeObra + subtotalRepuestos) * BigInt(porcentaje) + cincuenta) / cien;
  const descuento = servicios.length || repuestos.length ? (diagnostico + BigInt(1)) / dos : BigInt(0);
  const total = subtotalServicios + subtotalRepuestos + recargo - descuento;

  return {
    diagnostico: aDecimal(diagnostico),
    subtotalServicios: aDecimal(subtotalServicios),
    subtotalRepuestos: aDecimal(subtotalRepuestos),
    porcentajeRecargo: porcentaje,
    montoRecargo: aDecimal(recargo),
    descuentoDiagnostico: aDecimal(descuento),
    total: aDecimal(total),
    excedeLimite: total > maximoImporte,
  };
}

const formatoBs = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function mostrarBs(decimal: string) {
  return "Bs " + formatoBs.format(Number(decimal));
}
