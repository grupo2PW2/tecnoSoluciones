import { describe, expect, it } from "vitest";
import { calcularUnidadesMovimiento, maxUnidadesInventario } from "@/features/inventario/modelo";
import { calcularMargenSobreCosto, calcularPreciosEntrada, calcularTotalVenta } from "@/features/inventario/precios";
import { entradaSchema, salidaSchema, ventaSchema } from "../schemas";

const datos = { solicitudId: "bd76ffba-4de5-4378-8999-b7485595802e", referencia: "Lote de prueba" };
const partida = { repuestoId: 1, cajas: 4, unidadesCaja: 6, unidades: 3 };

describe("Cantidades de movimientos", () => {
  it("convierte cajas y unidades sueltas al saldo en unidades", () => {
    expect(calcularUnidadesMovimiento(4, 3, 6)).toBe(27);
    expect(calcularUnidadesMovimiento(0, 3, 0)).toBe(3);
  });

  it.each([
    [1, 0, 0],
    [-1, 3, 6],
    [0, 1.5, 6],
    [1, maxUnidadesInventario, 6],
  ])("rechaza cajas %i, unidades sueltas %f y presentación %i incompatibles", (cajas, unidades, unidadesCaja) => {
    expect(calcularUnidadesMovimiento(cajas, unidades, unidadesCaja)).toBeNull();
  });

  it("rechaza una entrada con el mismo repuesto en dos líneas", () => {
    const linea = { ...partida, costoTotal: "540.00" };
    expect(entradaSchema.safeParse({ ...datos, partidas: [linea, linea] }).success).toBe(false);
  });

  it("normaliza el costo del lote y exige un motivo para la salida", () => {
    const entrada = entradaSchema.parse({ ...datos, partidas: [{ ...partida, costoTotal: " 540,25 " }] });
    expect(entrada.partidas[0].costoTotal).toBe("540.25");
    expect(salidaSchema.safeParse({ ...datos, referencia: " ", partidas: [partida] }).success).toBe(false);
  });

  it("exige el precio confirmado para vender", () => {
    expect(ventaSchema.safeParse({ ...datos, partidas: [partida] }).success).toBe(false);
    expect(ventaSchema.safeParse({ ...datos, partidas: [{ ...partida, precioUnitario: "21.88" }] }).success).toBe(true);
  });
});

describe("Importes de movimientos", () => {
  it("pondera el costo existente con el costo del lote y aplica la ganancia al costo ponderado", () => {
    expect(calcularPreciosEntrada({
      cantidad: 27, costoTotal: "540.00", stockAnterior: 9, costoAnterior: "10.00", margenGanancia: "25.00",
    })).toEqual({ costoUnitario: "20.00", costoActual: "17.50", precioVenta: "21.88" });
  });

  it("calcula el margen efectivo y deja vacío el margen si el costo es cero", () => {
    expect(calcularMargenSobreCosto("21.88", "17.50")).toBe("25.03");
    expect(calcularMargenSobreCosto("8.00", "10.00")).toBe("-20.00");
    expect(calcularMargenSobreCosto("2.00", "0.00")).toBeNull();
  });

  it("suma el precio de venta por unidad con precisión de centavos", () => {
    expect(calcularTotalVenta([
      { cantidad: 3, precioUnitario: "0.10" }, { cantidad: 2, precioUnitario: "12.50" },
    ])).toBe("25.30");
  });
});
