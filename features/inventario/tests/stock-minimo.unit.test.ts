import { describe, expect, it } from "vitest";
import { mostrarCajasYUnidades } from "@/lib/existencias";
import { alertaStockMinimo } from "../modelo";
import { stockMinimoSchema } from "../schemas";

describe("Stock mínimo de Inventario", () => {
  it.each([
    { stock: 16, stockMinimo: 15, estado: null },
    { stock: 15, stockMinimo: 15, estado: "en-minimo" },
    { stock: 14, stockMinimo: 15, estado: "bajo-minimo" },
    { stock: 0, stockMinimo: 15, estado: "bajo-minimo" },
    { stock: 0, stockMinimo: 0, estado: null },
  ])("clasifica $stock unidades con un mínimo de $stockMinimo", ({ stock, stockMinimo, estado }) => {
    expect(alertaStockMinimo({ stock, stockMinimo })).toBe(estado);
  });

  it("muestra el mínimo en cajas y unidades sueltas cuando hay presentación por caja", () => {
    expect(mostrarCajasYUnidades({ stock: 15, unidadesCaja: 6 })).toBe("2 cajas y 3 unidades sueltas");
    expect(mostrarCajasYUnidades({ stock: 15, unidadesCaja: 0 })).toBe("15 unidades");
  });

  it.each([{ cajas: -1, unidades: 3 }, { cajas: 2, unidades: 1.5 }])(
    "rechaza las cantidades inválidas del mínimo ($cajas cajas y $unidades unidades)",
    ({ cajas, unidades }) => {
      expect(stockMinimoSchema.safeParse({ repuestoId: 1, cajas, unidades, unidadesCaja: 6 }).success).toBe(false);
    },
  );
});
