type Existencia = { stock: number; unidadesCaja: number };

export function mostrarUnidades(cantidad: number) {
  return cantidad + (cantidad === 1 ? " unidad" : " unidades");
}

export function mostrarCajasYUnidades({ stock, unidadesCaja }: Existencia) {
  if (unidadesCaja <= 0 || stock < unidadesCaja) return mostrarUnidades(stock);

  const cajas = Math.floor(stock / unidadesCaja);
  const sueltas = stock % unidadesCaja;
  return cajas + (cajas === 1 ? " caja" : " cajas") +
    (sueltas ? " y " + sueltas + (sueltas === 1 ? " unidad suelta" : " unidades sueltas") : "");
}

export function mostrarExistencias(existencia: Existencia) {
  const unidades = mostrarUnidades(existencia.stock);
  const detalle = mostrarCajasYUnidades(existencia);
  return unidades === detalle ? unidades : unidades + " (" + detalle + ")";
}
