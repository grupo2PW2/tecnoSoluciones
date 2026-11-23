export interface RepuestoInventario {
  id: number;
  sku: string;
  imgUrl: string | null;
  nombre: string;
  unidadesCaja: number;
  precioVenta: string;
  costoActual: string;
  estado: "DISPONIBLE" | "AGOTADO" | "EN_REPOSICION" | "DESCATALOGADO";
  stock: number;
  stockMinimo: number;
}

export const maxUnidadesInventario = 2147483647;

export function calcularUnidadesMovimiento(cajas: number, unidades: number, unidadesCaja: number) {
  if (!Number.isInteger(cajas) || cajas < 0 || !Number.isInteger(unidades) || unidades < 0 ||
    (cajas > 0 && unidadesCaja <= 0)) return null;

  const total = cajas * Math.max(0, unidadesCaja) + unidades;
  return total <= maxUnidadesInventario ? total : null;
}
