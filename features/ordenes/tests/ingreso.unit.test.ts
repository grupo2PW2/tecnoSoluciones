import { describe, expect, it } from "vitest";
import { estadosAsignables, puedeConsultarOrdenes, puedeRegistrarIngreso, puedeTomarOrdenes } from "../modelo";
import { ingresoSchema } from "../schemas";

const ingreso = {
  solicitud: "bd76ffba-4de5-4378-8999-b7485595802e",
  clienteId: 1,
  dispositivoId: 2,
  tipoIngreso: "DIAGNOSTICO",
  problemasReportados: "  No enciende  ",
  condicionDispositivo: "  Rayones  ",
  accesoriosRecibidos: "  Cargador  ",
};

describe("Validación del ingreso", () => {
  it("admite un ingreso sin técnico y quita los espacios exteriores", () => {
    expect(ingresoSchema.parse(ingreso)).toMatchObject({
      tipoIngreso: "DIAGNOSTICO",
      problemasReportados: "No enciende",
      condicionDispositivo: "Rayones",
      accesoriosRecibidos: "Cargador",
    });
  });

  it("admite un servicio directo con técnico asignado", () => {
    expect(ingresoSchema.safeParse({ ...ingreso, tipoIngreso: "SERVICIO_DIRECTO", tecnicoId: 3 }).success).toBe(true);
  });

  it.each([
    { campo: "solicitud", valor: "sin identificador" },
    { campo: "clienteId", valor: 0 },
    { campo: "dispositivoId", valor: 1.5 },
    { campo: "tecnicoId", valor: 2147483648 },
    { campo: "tipoIngreso", valor: "DESCONOCIDO" },
    { campo: "problemasReportados", valor: " " },
    { campo: "accesoriosRecibidos", valor: "x".repeat(1001) },
  ])("rechaza un valor inválido en $campo", ({ campo, valor }) => {
    const resultado = ingresoSchema.safeParse({ ...ingreso, [campo]: valor });

    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0].path).toEqual([campo]);
  });
});

describe("Permisos y estados de Órdenes", () => {
  it.each([
    { rol: "ADMINISTRADOR", registra: true, consulta: true, toma: false },
    { rol: "RECEPCIONISTA", registra: true, consulta: true, toma: false },
    { rol: "GERENTE", registra: false, consulta: true, toma: false },
    { rol: "TECNICO", registra: false, consulta: false, toma: true },
    { rol: undefined, registra: false, consulta: false, toma: false },
  ])("aplica los permisos de $rol", ({ rol, registra, consulta, toma }) => {
    expect(puedeRegistrarIngreso(rol)).toBe(registra);
    expect(puedeConsultarOrdenes(rol)).toBe(consulta);
    expect(puedeTomarOrdenes(rol)).toBe(toma);
  });

  it("permite asignar únicamente órdenes en estados abiertos", () => {
    expect(estadosAsignables).toEqual([
      "RECIBIDO", "EN_DIAGNOSTICO", "PENDIENTE_APROBACION", "APROBADO", "EN_REPARACION",
    ]);
  });
});
