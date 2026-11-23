import { describe, expect, it } from "vitest";
import { calcularPresupuesto, importePartida, sumarImportesRegistrados } from "../importes";

describe("Importes de presupuesto", () => {
  it.each([
    { prioridad: "BAJA", tasa: 0, recargo: "0.00", total: "425.00" },
    { prioridad: "MEDIA", tasa: 5, recargo: "20.00", total: "445.00" },
    { prioridad: "ALTA", tasa: 10, recargo: "40.00", total: "465.00" },
  ] as const)("calcula el recargo $prioridad sobre mano de obra y repuestos", ({ prioridad, tasa, recargo, total }) => {
    expect(calcularPresupuesto(
      [{ cantidad: 2, precioUnitario: "150.00" }],
      [{ cantidad: 1, precioUnitario: "100.00" }],
      "50.00",
      prioridad,
    )).toMatchObject({
      subtotalServicios: "350.00", subtotalRepuestos: "100.00",
      porcentajeRecargo: tasa, montoRecargo: recargo, descuentoDiagnostico: "25.00",
      total, excedeLimite: false,
    });
  });

  it("conserva la tarifa completa cuando solo hay diagnóstico", () => {
    expect(calcularPresupuesto([], [], "50.00", "ALTA")).toMatchObject({
      total: "50.00", montoRecargo: "0.00", descuentoDiagnostico: "0.00",
    });
  });

  it("redondea los medios centavos del recargo y el descuento", () => {
    expect(calcularPresupuesto([{ cantidad: 1, precioUnitario: "0.10" }], [], "0.03", "MEDIA"))
      .toMatchObject({ montoRecargo: "0.01", descuentoDiagnostico: "0.02", total: "0.12" });
    expect(importePartida({ cantidad: 3, precioUnitario: "0.10" })).toBe("0.30");
  });

  it("detecta cuando el total excede el límite de almacenamiento", () => {
    expect(calcularPresupuesto([{ cantidad: 1, precioUnitario: "99999999.99" }], [], "0", "BAJA").excedeLimite).toBe(false);
    expect(calcularPresupuesto([{ cantidad: 1, precioUnitario: "99999999.99" }], [], "0", "MEDIA").excedeLimite).toBe(true);
  });

  it("suma importes registrados con precisión y rechaza valores inválidos o fuera de rango", () => {
    expect(sumarImportesRegistrados(["0.10", "0.20", "1.5"])).toBe("1.80");
    expect(sumarImportesRegistrados(["2.345"])).toBeNull();
    expect(sumarImportesRegistrados(["99999999.99", "0.01"])).toBeNull();
  });
});
