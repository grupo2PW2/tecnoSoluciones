export const formatoCostoTotal = /^\d{1,18}([.,]\d{1,2})?$/;

const cien = BigInt(100);
const factorPorcentaje = BigInt(10000);
const maxPrecio = BigInt("9999999999");
const enteros = new Intl.NumberFormat("es-BO");

function aCentavos(valor: string) {
  const [entero, fraccion = ""] = valor.trim().split(/[.,]/);
  return BigInt(entero + fraccion.padEnd(2, "0"));
}

function aDecimal(centavos: bigint) {
  return String(centavos / cien) + "." + String(centavos % cien).padStart(2, "0");
}

function redondear(numerador: bigint, denominador: bigint) {
  return (numerador + denominador / BigInt(2)) / denominador;
}

export function gananciaValida(valor: string) {
  return /^\d{1,3}([.,]\d{1,2})?$/.test(valor.trim());
}

function aplicarGanancia(costo: bigint, margenGanancia: string) {
  return redondear(costo * (factorPorcentaje + aCentavos(margenGanancia)), factorPorcentaje);
}

export function calcularPrecioVenta(costo: string, margenGanancia: string) {
  if (!formatoCostoTotal.test(costo.trim()) || !gananciaValida(margenGanancia)) return null;
  const precio = aplicarGanancia(aCentavos(costo), margenGanancia);
  return precio <= maxPrecio ? aDecimal(precio) : null;
}

export function calcularPreciosEntrada({ cantidad, costoTotal, stockAnterior, costoAnterior, margenGanancia }: {
  cantidad: number;
  costoTotal: string;
  stockAnterior: number;
  costoAnterior: string;
  margenGanancia: string;
}) {
  if (!Number.isInteger(cantidad) || cantidad <= 0 || !Number.isInteger(stockAnterior) || stockAnterior < 0 ||
    !formatoCostoTotal.test(costoTotal.trim()) || !gananciaValida(margenGanancia) ||
    (stockAnterior > 0 && !formatoCostoTotal.test(costoAnterior.trim()))) return null;

  const compra = aCentavos(costoTotal);
  const unidadesNuevas = BigInt(cantidad);
  const unidadesPrevias = BigInt(stockAnterior);
  const valorAnterior = stockAnterior > 0 ? unidadesPrevias * aCentavos(costoAnterior) : BigInt(0);
  const costoUnitario = redondear(compra, unidadesNuevas);
  const costoActual = redondear(valorAnterior + compra, unidadesPrevias + unidadesNuevas);
  const precioVenta = aplicarGanancia(costoActual, margenGanancia);

  if ([costoUnitario, costoActual, precioVenta].some((importe) => importe > maxPrecio)) return null;
  return {
    costoUnitario: aDecimal(costoUnitario),
    costoActual: aDecimal(costoActual),
    precioVenta: aDecimal(precioVenta),
  };
}

export function calcularMargenSobreCosto(precioUnitario: string, costoUnitario: string) {
  const costo = aCentavos(costoUnitario);
  if (costo === BigInt(0)) return null;

  const diferencia = aCentavos(precioUnitario) - costo;
  const esPerdida = diferencia < BigInt(0);
  const magnitud = esPerdida ? -diferencia : diferencia;
  const margen = redondear(magnitud * factorPorcentaje, costo);
  return (esPerdida && margen > BigInt(0) ? "-" : "") + aDecimal(margen);
}

export function calcularTotalVenta(partidas: readonly { cantidad: number; precioUnitario: string | null }[]) {
  if (partidas.some(({ precioUnitario }) => precioUnitario === null)) return null;
  return aDecimal(partidas.reduce((total, { cantidad, precioUnitario }) =>
    total + BigInt(cantidad) * aCentavos(precioUnitario ?? "0"), BigInt(0)));
}

export function mostrarImporteExacto(valor: string) {
  const centavos = aCentavos(valor);
  return "Bs " + enteros.format(centavos / cien) + "," + String(centavos % cien).padStart(2, "0");
}
