import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createSession, sessionCookieName } from "@/lib/session";
import { db } from "@/src/prisma/db";
import type { RolUsuario } from "@/features/usuarios/modelo";
import { asignarTecnico, consultarTicket, registrarIngreso, tomarOrden } from "../actions";
import { contarOrdenesActivas } from "../asignacion";
import type { DatosIngreso } from "../schemas";

const sesion = vi.hoisted(() => ({ valor: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (nombre: string) => nombre === sessionCookieName && sesion.valor ? { value: sesion.valor } : undefined,
  }),
}));

function crearUsuario(rol: RolUsuario) {
  const referencia = randomUUID();
  return db.orm.public.Usuarios.select("id", "rol").create({
    nombre: "Usuario",
    apellido: "Prueba",
    DNI: referencia,
    username: referencia,
    password: "sin-credenciales-de-login",
    rol,
    activo: true,
  });
}

async function iniciarSesion(usuario: { id: number; rol: RolUsuario }) {
  sesion.valor = (await createSession(usuario.id, usuario.rol)).value;
}

async function crearFicha() {
  const cliente = await db.orm.public.Clientes.select("id").create({ nombre: "Cliente", apellido: "Prueba" });
  const equipo = await db.orm.public.Dispositivos.select("id").create({
    clienteId: cliente.id,
    tipo: "CELULAR",
    marca: "Marca",
    modelo: "Modelo",
  });
  return { cliente, equipo };
}

async function prepararEscenario() {
  const [recepcion, tecnico, ficha] = await Promise.all([
    crearUsuario("RECEPCIONISTA"),
    crearUsuario("TECNICO"),
    crearFicha(),
  ]);
  await iniciarSesion(recepcion);
  return { recepcion, tecnico, ...ficha };
}

let escenario: Awaited<ReturnType<typeof prepararEscenario>>;

beforeEach(async () => {
  escenario = await prepararEscenario();
});

afterAll(async () => {
  await db.close();
});

function datosIngreso(cambios: Partial<DatosIngreso> = {}): DatosIngreso {
  return {
    solicitud: randomUUID(),
    clienteId: escenario.cliente.id,
    dispositivoId: escenario.equipo.id,
    tipoIngreso: "DIAGNOSTICO",
    problemasReportados: "El equipo no enciende",
    condicionDispositivo: "Con rayones",
    accesoriosRecibidos: "Cargador",
    ...cambios,
  };
}

async function registrarOrden(cambios: Partial<DatosIngreso> = {}) {
  const resultado = await registrarIngreso(datosIngreso(cambios));
  if ("error" in resultado) throw new Error(resultado.error);
  return db.orm.public.Orden.firstOrThrow({ codigoCliente: resultado.ticket.codigoCliente });
}

describe("Ingreso de órdenes con PostgreSQL", () => {
  it("registra la orden y reproduce el mismo ticket al consultarlo", async () => {
    const resultado = await registrarIngreso(datosIngreso());
    expect(resultado).toMatchObject({ ticket: { equipo: "Marca Modelo" } });
    if ("error" in resultado) throw new Error(resultado.error);

    const orden = await db.orm.public.Orden.firstOrThrow({ codigoCliente: resultado.ticket.codigoCliente });
    expect(orden).toMatchObject({
      codigo: "OS-" + String(orden.id).padStart(6, "0"),
      estado: "RECIBIDO",
      dispositivoId: escenario.equipo.id,
      recepcionistaId: escenario.recepcion.id,
      tecnicoId: null,
      tipoIngreso: "DIAGNOSTICO",
      problemasReportados: "El equipo no enciende",
      condicionDispositivo: "Con rayones",
      accesoriosRecibidos: "Cargador",
    });
    expect(await consultarTicket(orden.id)).toEqual(resultado);
  });

  it("permite que Administración registre con técnico desde el ingreso", async () => {
    const administrador = await crearUsuario("ADMINISTRADOR");
    await iniciarSesion(administrador);

    const orden = await registrarOrden({ tecnicoId: escenario.tecnico.id, tipoIngreso: "SERVICIO_DIRECTO" });

    expect(orden).toMatchObject({
      recepcionistaId: administrador.id,
      tecnicoId: escenario.tecnico.id,
      tipoIngreso: "SERVICIO_DIRECTO",
    });
    expect(await contarOrdenesActivas(db, escenario.tecnico.id)).toBe(1);
  });

  it("rechaza un equipo que pertenece a otro cliente y no crea una orden", async () => {
    const otraFicha = await crearFicha();

    const resultado = await registrarIngreso(datosIngreso({ dispositivoId: otraFicha.equipo.id }));

    expect(resultado).toEqual({ error: "Selecciona un equipo que pertenezca al cliente elegido." });
    const { total } = await db.orm.public.Orden.where({ recepcionistaId: escenario.recepcion.id })
      .aggregate((agregado) => ({ total: agregado.count() }));
    expect(total).toBe(0);
  });

  it("conserva un solo registro y el mismo ticket ante reintentos simultáneos", async () => {
    const solicitud = datosIngreso();
    const [primera, segunda] = await Promise.all([
      registrarIngreso(solicitud),
      registrarIngreso(solicitud),
    ]);

    expect(primera).toMatchObject({ ticket: { codigoCliente: expect.stringMatching(/^[a-f0-9]{32}$/) } });
    expect(segunda).toEqual(primera);
    expect(await registrarIngreso(solicitud)).toEqual(primera);
    const { total } = await db.orm.public.Orden.where({ recepcionistaId: escenario.recepcion.id })
      .aggregate((agregado) => ({ total: agregado.count() }));
    expect(total).toBe(1);
  });

  it.each(["GERENTE", "TECNICO", null] as const)("rechaza el ingreso sin permiso de %s", async (rol) => {
    const usuario = rol ? await crearUsuario(rol) : null;
    if (usuario) await iniciarSesion(usuario);
    else sesion.valor = undefined;

    expect(await registrarIngreso(datosIngreso())).toEqual({
      error: "Tu usuario no tiene permiso para realizar esta operación.",
    });
    const { total } = await db.orm.public.Orden.where({ dispositivoId: escenario.equipo.id })
      .aggregate((agregado) => ({ total: agregado.count() }));
    expect(total).toBe(0);
  });
});

describe("Asignación de técnicos con PostgreSQL", () => {
  it("permite asignar después del ingreso y conserva al técnico al repetir la solicitud", async () => {
    const orden = await registrarOrden();

    expect(await asignarTecnico(orden.id, escenario.tecnico.id)).toEqual({ asignada: true });
    expect(await asignarTecnico(orden.id, escenario.tecnico.id)).toEqual({ asignada: true });

    const actual = await db.orm.public.Orden.firstOrThrow({ id: orden.id });
    expect(actual.tecnicoId).toBe(escenario.tecnico.id);
    expect(await contarOrdenesActivas(db, escenario.tecnico.id)).toBe(1);
  });

  it("solo asigna una orden cuando dos tomas compiten por el último cupo", async () => {
    await registrarOrden({ tecnicoId: escenario.tecnico.id });
    await registrarOrden({ tecnicoId: escenario.tecnico.id });
    const [primera, segunda] = await Promise.all([registrarOrden(), registrarOrden()]);
    await iniciarSesion(escenario.tecnico);

    const respuestas = await Promise.all([tomarOrden(primera.id), tomarOrden(segunda.id)]);

    expect(respuestas).toEqual(expect.arrayContaining([
      { asignada: true },
      { error: "El técnico ya tiene tres órdenes activas." },
    ]));
    expect(await contarOrdenesActivas(db, escenario.tecnico.id)).toBe(3);
    const candidatas = await db.orm.public.Orden.where((orden) => orden.id.in([primera.id, segunda.id]))
      .select("tecnicoId").all();
    expect(candidatas.map(({ tecnicoId }) => tecnicoId)).toEqual(expect.arrayContaining([escenario.tecnico.id, null]));
  });

  it("impide que Recepción tome una orden como técnico", async () => {
    const orden = await registrarOrden();

    expect(await tomarOrden(orden.id)).toEqual({
      error: "Tu usuario no tiene permiso para realizar esta operación.",
    });
    expect((await db.orm.public.Orden.firstOrThrow({ id: orden.id })).tecnicoId).toBeNull();
  });
});
