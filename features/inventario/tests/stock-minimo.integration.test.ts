import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { guardarEntrada, guardarSalida } from "@/features/movimientos/actions";
import { consultarDashboardAdministracion } from "@/features/panel/dashboard-consultas";
import { createSession, sessionCookieName } from "@/lib/session";
import { db } from "@/src/prisma/db";
import { guardarStockMinimo } from "../actions";
import { listarRepuestos } from "../consultas";
import { alertaStockMinimo, maxUnidadesInventario } from "../modelo";

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

function crearRepuesto(unidadesCaja: number) {
  return db.orm.public.Repuestos.select("id").create({
    nombre: "Repuesto de prueba", sku: randomUUID(), unidadesCaja,
  });
}

async function consultarRepuesto(id: number) {
  const repuesto = (await listarRepuestos()).find((item) => item.id === id);
  if (!repuesto) throw new Error("No se encontró el repuesto de prueba en Inventario.");
  return repuesto;
}

let recepcion: Awaited<ReturnType<typeof crearUsuario>>;

beforeAll(async () => {
  recepcion = await crearUsuario("RECEPCIONISTA");
});

beforeEach(async () => {
  await autenticar(recepcion);
});

afterAll(async () => {
  await db.close();
});

describe("Stock mínimo con PostgreSQL", () => {
  it("guarda el mínimo de 2 cajas y 3 unidades y actualiza los avisos al mover stock", async () => {
    const repuesto = await crearRepuesto(6);
    await db.orm.public.Inventario.create({ repuestoId: repuesto.id, stock: 16 });

    expect(await guardarStockMinimo({ repuestoId: repuesto.id, unidadesCaja: 6, cajas: 2, unidades: 3 }))
      .toEqual({ guardado: true });
    const inicial = await consultarRepuesto(repuesto.id);
    expect(inicial).toMatchObject({ stock: 16, stockMinimo: 15 });
    expect(alertaStockMinimo(inicial)).toBeNull();
    const avisosIniciales = (await consultarDashboardAdministracion()).bajoMinimo;

    const partida = { repuestoId: repuesto.id, cajas: 0, unidadesCaja: 6, unidades: 1 };
    for (const alerta of ["en-minimo", "bajo-minimo"]) {
      expect(await guardarSalida({ solicitudId: randomUUID(), referencia: "Salida de prueba", partidas: [partida] }))
        .toMatchObject({ registrada: true });
      expect(alertaStockMinimo(await consultarRepuesto(repuesto.id))).toBe(alerta);
      expect((await consultarDashboardAdministracion()).bajoMinimo).toBe(avisosIniciales + 1);
    }

    expect(await guardarEntrada({
      solicitudId: randomUUID(), referencia: "Reposición de prueba",
      partidas: [{ ...partida, unidades: 2, costoTotal: "20.00" }],
    })).toMatchObject({ registrada: true });
    const repuestoConStock = await consultarRepuesto(repuesto.id);
    expect(repuestoConStock).toMatchObject({ stock: 16, stockMinimo: 15 });
    expect(alertaStockMinimo(repuestoConStock)).toBeNull();
    expect((await consultarDashboardAdministracion()).bajoMinimo).toBe(avisosIniciales);
  });

  it("permite que Administración fije el mínimo sin fila de existencias y lo quite con cero", async () => {
    await autenticar(await crearUsuario("ADMINISTRADOR"));
    const repuesto = await crearRepuesto(0);
    const datos = { repuestoId: repuesto.id, unidadesCaja: 0, cajas: 0 };

    expect(await db.orm.public.Inventario.first({ repuestoId: repuesto.id })).toBeNull();
    expect(await guardarStockMinimo({ ...datos, unidades: 3 })).toEqual({ guardado: true });
    const conMinimo = await consultarRepuesto(repuesto.id);
    expect(conMinimo).toMatchObject({ stock: 0, stockMinimo: 3 });
    expect(alertaStockMinimo(conMinimo)).toBe("bajo-minimo");

    expect(await guardarStockMinimo({ ...datos, unidades: 0 })).toEqual({ guardado: true });
    const sinMinimo = await consultarRepuesto(repuesto.id);
    expect(sinMinimo).toMatchObject({ stock: 0, stockMinimo: 0 });
    expect(alertaStockMinimo(sinMinimo)).toBeNull();
  });

  it("conserva el mínimo cuando un formulario usa una presentación anterior", async () => {
    const repuesto = await crearRepuesto(6);
    await db.orm.public.Inventario.create({ repuestoId: repuesto.id, stock: 8, stockMinimo: 4 });

    expect(await guardarStockMinimo({ repuestoId: repuesto.id, unidadesCaja: 12, cajas: 1, unidades: 0 }))
      .toEqual({ error: "Cambió la presentación del repuesto. Actualiza la página y revisa el mínimo." });
    expect(await consultarRepuesto(repuesto.id)).toMatchObject({ stock: 8, stockMinimo: 4 });
  });

  it.each([
    { unidadesCaja: 0, cajas: 1, unidades: 0 },
    { unidadesCaja: 6, cajas: 1, unidades: maxUnidadesInventario },
  ])("rechaza un mínimo incompatible con la presentación o fuera de rango", async ({ unidadesCaja, cajas, unidades }) => {
    const repuesto = await crearRepuesto(unidadesCaja);

    expect(await guardarStockMinimo({ repuestoId: repuesto.id, unidadesCaja, cajas, unidades }))
      .toMatchObject({ error: expect.stringContaining("fuera del rango permitido") });
    expect(await db.orm.public.Inventario.first({ repuestoId: repuesto.id })).toBeNull();
  });

  it.each(["TECNICO", "GERENTE", null] as const)("impide guardar un mínimo sin permiso de %s", async (rol) => {
    if (rol) await autenticar(await crearUsuario(rol));
    else sesion.valor = undefined;
    const repuesto = await crearRepuesto(0);

    expect(await guardarStockMinimo({ repuestoId: repuesto.id, unidadesCaja: 0, cajas: 0, unidades: 3 }))
      .toEqual({ error: "Tu usuario no tiene permiso para editar el stock mínimo." });
    expect(await db.orm.public.Inventario.first({ repuestoId: repuesto.id })).toBeNull();
  });
});
