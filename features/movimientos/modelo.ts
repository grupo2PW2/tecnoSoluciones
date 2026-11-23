export type TipoMovimientoRegistrable = "ENTRADA" | "SALIDA" | "SALIDA_VENTA";

export type TipoMovimiento = TipoMovimientoRegistrable | "SALIDA_REPARACION";

export interface MovimientoInventario {
  tipo: TipoMovimiento;
  orden: { id: number; codigo: string } | null;
  id: number;
  fecha: string;
  referencia: string | null;
  responsable: string | null;
  partidas: {
    id: number;
    nombre: string;
    sku: string | null;
    cantidad: number;
    costoUnitario: string;
    costoTotal: string | null;
    precioUnitario: string | null;
    margenAplicado: string | null;
  }[];
}
