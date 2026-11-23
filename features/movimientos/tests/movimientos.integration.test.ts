import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createSession, sessionCookieName } from "@/lib/session";
import { db } from "@/src/prisma/db";
import { guardarEntrada, guardarSalida, guardarVenta } from "../actions";

const sesion = vi.hoisted(() => ({ valor: undefined as string | undefined }));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nombre: string) => nombre === sessionCookieName && sesion.valor ? { value: sesion.valor } : undefined,
  }),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function crearUsuario(rol: "ADMINISTRADOR" | "RECEPCIONISTA" | "TECNICO" | "GERENTE") {
  const referencia = randomUUID();
  return db.orm.public.Usuarios.select("id", "rol").create({
    nombre: "Usuario", apellido: "Prueba", DNI: referencia, username: referencia,
    password: "sin-credenciales-de-login", rol,
  });
}

async function autenticar(usuario: Awaited<ReturnType<typeof crearUsuario>>) {
  sesion.valor = (await createSession(usuario.id, usuario.rol)).value;
}

async function crearRepuesto(nombre: string, stock: number, unidadesCaja = 0) {
  const repuesto = await db.orm.public.Repuestos.select("id", "unidadesCaja").create({
    nombre, sku: randomUUID(), unidadesCaja, estado: stock ? "DISPONIBLE" : "AGOTADO",
    costoActual: stock ? "10.00" : "0.00", precioVenta: stock ? "12.50" : "0.00",
  });
  await db.orm.public.Inventario.create({ repuestoId: repuesto.id, stock });
  return repuesto;
}

function linea(repuesto: { id: number; unidadesCaja: number }, unidades: number, cajas = 0) {
  return { repuestoId: repuesto.id, unidadesCaja: repuesto.unidadesCaja, cajas, unidades };
}

async function stock(repuestoId: number) {
  return (await db.orm.public.Inventario.firstOrThrow({ repuestoId })).stock;
}

function solicitud() {
  return { solicitudId: randomUUID(), referencia: "Movimiento de prueba" };
}

let recepcion: Awaited<ReturnType<typeof crearUsuario>>;

beforeAll(async () => {
  recepcion = await crearUsuario("RECEPCIONISTA");
  await db.orm.public.Configuracion.create({ margenGanancia: "25.00" });
});

beforeEach(async () => {
  await autenticar(recepcion);
});

afterAll(async () => {
  await db.close();
});

describe("Entradas de stock con PostgreSQL", () => {
  it("registra un lote de varios repuestos, sus cantidades y sus costos", async () => {
    const pantalla = await crearRepuesto("Pantalla", 9, 6);
    const cable = await crearRepuesto("Cable", 0);
    const datos = solicitud();

    const resultado = await guardarEntrada({
      ...datos, partidas: [
        { ...linea(pantalla, 3, 4), costoTotal: "540,00" },
        { ...linea(cable, 3), costoTotal: "30.00" },
      ],
    });

    expect(resultado).toMatchObject({ registrada: true, repetida: false });
    const movimiento = await db.orm.public.Movimientos.firstOrThrow({ solicitudId: datos.solicitudId });
    expect(movimiento).toMatchObject({ tipo: "ENTRADA", registradoPorId: recepcion.id });
    const partidas = await db.orm.public.DetalleMovimientos.where({ movimientoId: movimiento.id }).all();
    expect(partidas).toHaveLength(2);
    expect(partidas).toEqual(expect.arrayContaining([
      expect.objectContaining({ repuestoId: pantalla.id, cantidad: 27, costoTotal: "540.00", costoUnitario: "20.00", margenAplicado: null }),
      expect.objectContaining({ repuestoId: cable.id, cantidad: 3, costoTotal: "30.00", costoUnitario: "10.00", margenAplicado: null }),
    ]));
    expect(await stock(pantalla.id)).toBe(36);
    expect(await stock(cable.id)).toBe(3);
    expect(await db.orm.public.Repuestos.firstOrThrow({ id: pantalla.id }))
      .toMatchObject({ costoActual: "17.50", precioVenta: "21.88" });
    expect(await db.orm.public.Repuestos.firstOrThrow({ id: cable.id }))
      .toMatchObject({ estado: "DISPONIBLE", costoActual: "10.00", precioVenta: "12.50" });
  });

  it("rechaza el movimiento si cambió la presentación por caja", async () => {
    const repuesto = await crearRepuesto("Batería", 4, 6);
    const datos = solicitud();
    const resultado = await guardarEntrada({
      ...datos, partidas: [{ ...linea(repuesto, 0, 1), unidadesCaja: 12, costoTotal: "60.00" }],
    });

    expect(resultado).toMatchObject({ error: expect.stringContaining("Revisa la presentación de Batería") });
    expect(await stock(repuesto.id)).toBe(4);
    expect(await db.orm.public.Movimientos.first({ solicitudId: datos.solicitudId })).toBeNull();
  });
});

describe("Salidas y ventas con PostgreSQL", () => {
  it("rechaza toda la salida cuando falta stock en la segunda línea", async () => {
    const pantalla = await crearRepuesto("Pantalla", 8, 6);
    const cable = await crearRepuesto("Cable", 2);
    const datos = solicitud();

    expect(await guardarSalida({ ...datos, partidas: [linea(pantalla, 1, 1), linea(cable, 3)] }))
      .toEqual({ error: "Stock insuficiente para Cable. Disponible: 2 unidades." });
    expect(await stock(pantalla.id)).toBe(8);
    expect(await stock(cable.id)).toBe(2);
    expect(await db.orm.public.Movimientos.first({ solicitudId: datos.solicitudId })).toBeNull();
  });

  it("impide que dos salidas simultáneas dejen stock negativo", async () => {
    const repuesto = await crearRepuesto("Conector", 5);
    const partidas = [linea(repuesto, 4)];
    const resultados = await Promise.all([
      guardarSalida({ ...solicitud(), partidas }),
      guardarSalida({ ...solicitud(), partidas }),
    ]);

    expect(resultados).toEqual(expect.arrayContaining([
      expect.objectContaining({ registrada: true, repetida: false }),
      { error: "Stock insuficiente para Conector. Disponible: 1 unidad." },
    ]));
    expect(await stock(repuesto.id)).toBe(1);
    expect(await db.orm.public.DetalleMovimientos.where({ repuestoId: repuesto.id }).select("cantidad").all())
      .toEqual([{ cantidad: 4 }]);
  });

  it("descuenta una sola vez una venta repetida y conserva su precio, costo y margen", async () => {
    const administrador = await crearUsuario("ADMINISTRADOR");
    await autenticar(administrador);
    const repuesto = await crearRepuesto("Batería", 7, 6);
    const datos = solicitud();
    const venta = { ...datos, partidas: [{ ...linea(repuesto, 1, 1), precioUnitario: "12.50" }] };

    const resultados = await Promise.all([guardarVenta(venta), guardarVenta(venta)]);
    const movimiento = await db.orm.public.Movimientos.firstOrThrow({ solicitudId: datos.solicitudId });

    expect(resultados).toEqual(expect.arrayContaining([
      { registrada: true, id: movimiento.id, repetida: false },
      { registrada: true, id: movimiento.id, repetida: true },
    ]));
    expect(movimiento).toMatchObject({ tipo: "SALIDA_VENTA", registradoPorId: administrador.id });
    expect(await stock(repuesto.id)).toBe(0);
    expect(await db.orm.public.Repuestos.firstOrThrow({ id: repuesto.id })).toMatchObject({ estado: "AGOTADO" });
    expect(await db.orm.public.DetalleMovimientos.where({ repuestoId: repuesto.id })
      .select("cantidad", "costoUnitario", "precioUnitario", "margenAplicado").all())
      .toEqual([{ cantidad: 7, costoUnitario: "10.00", precioUnitario: "12.50", margenAplicado: "25.00" }]);
  });

  it("rechaza una venta hecha con un precio anterior", async () => {
    const repuesto = await crearRepuesto("Cable", 3);
    const datos = solicitud();

    expect(await guardarVenta({ ...datos, partidas: [{ ...linea(repuesto, 2), precioUnitario: "11.00" }] }))
      .toMatchObject({ error: expect.stringContaining("Cambió el precio de Cable") });
    expect(await stock(repuesto.id)).toBe(3);
    expect(await db.orm.public.Movimientos.first({ solicitudId: datos.solicitudId })).toBeNull();
  });

  it.each(["TECNICO", "GERENTE"] as const)("impide que el rol %s registre salidas", async (rol) => {
    await autenticar(await crearUsuario(rol));
    const repuesto = await crearRepuesto("Conector", 3);
    const datos = solicitud();

    expect(await guardarSalida({ ...datos, partidas: [linea(repuesto, 1)] }))
      .toEqual({ error: "Tu usuario no tiene permiso para registrar salidas de stock." });
    expect(await stock(repuesto.id)).toBe(3);
    expect(await db.orm.public.Movimientos.first({ solicitudId: datos.solicitudId })).toBeNull();
  });
});
