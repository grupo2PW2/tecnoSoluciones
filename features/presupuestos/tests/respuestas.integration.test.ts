import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { nombreDiagnosticoGeneral } from "@/features/ordenes/diagnostico-general";
import { calcularCobroEntrega, confirmarEntregaOrden } from "@/features/ordenes/entrega";
import { db } from "@/src/prisma/db";
import { responderPresupuestoWeb } from "../acciones-respuesta";
import { obtenerPresupuestoOrden } from "../consultas";
import { fechaBolivia } from "../fechas";
import { guardarCotizacion } from "../servicio";

const diaMs = 86_400_000;

function crearUsuario(rol: "RECEPCIONISTA" | "TECNICO") {
  const referencia = randomUUID();
  return db.orm.public.Usuarios.select("id").create({
    nombre: "Usuario", apellido: "Prueba", DNI: referencia, username: referencia,
    password: "sin-credenciales-de-login", rol,
  });
}

async function crearCatalogo() {
  const [recepcion, tecnico, diagnostico, reparacion] = await Promise.all([
    crearUsuario("RECEPCIONISTA"),
    crearUsuario("TECNICO"),
    db.orm.public.Servicios.select("id").create({ nombre: nombreDiagnosticoGeneral, precioReferencial: "50.00" }),
    db.orm.public.Servicios.select("id").create({ nombre: "Reparación de prueba", precioReferencial: "400.00" }),
  ]);
  const cliente = await db.orm.public.Clientes.select("id").create({ nombre: "Cliente", apellido: "Prueba" });
  const equipo = await db.orm.public.Dispositivos.select("id").create({
    clienteId: cliente.id, tipo: "CELULAR", marca: "Marca", modelo: "Modelo",
  });
  return { recepcion, tecnico, diagnostico, reparacion, equipo };
}

let catalogo: Awaited<ReturnType<typeof crearCatalogo>>;

beforeAll(async () => {
  catalogo = await crearCatalogo();
});

afterAll(async () => {
  await db.close();
});

async function presentarOferta() {
  const orden = await db.orm.public.Orden.select("id", "codigoCliente").create({
    codigo: randomUUID(), codigoCliente: randomUUID(),
    dispositivoId: catalogo.equipo.id, tecnicoId: catalogo.tecnico.id,
    recepcionistaId: catalogo.recepcion.id, estado: "EN_DIAGNOSTICO",
    tipoIngreso: "DIAGNOSTICO", problemasReportados: "No enciende",
  });
  const presupuesto = await db.orm.public.Presupuestos.select("id").create({ ordenId: orden.id });

  await db.orm.public.PresupuestoServicio.create({
    presupuestoId: presupuesto.id, servicioId: catalogo.diagnostico.id,
    precioUnitario: "50.00", estado: "FINALIZADO", trabajoVerificado: true,
  });

  const ahora = Date.now();
  const respuesta = await guardarCotizacion({
    ordenId: orden.id, presupuestoId: presupuesto.id, presentar: true,
    prioridad: "MEDIA", observaciones: "",
    fechaEstimada: fechaBolivia(new Date(ahora + 2 * diaMs)),
    fechaVencimiento: fechaBolivia(new Date(ahora + diaMs)),
    servicios: [{ id: catalogo.reparacion.id, cantidad: 1, precioUnitario: "400.00" }],
    repuestos: [],
  }, { tipo: "tecnico", id: catalogo.tecnico.id });

  expect(respuesta).toEqual({ guardado: true });
  return { orden, solicitud: { codigoCliente: orden.codigoCliente, presupuestoId: presupuesto.id } };
}

describe("Respuesta a presupuestos con PostgreSQL", () => {
  it("guarda el importe presentado, autoriza los servicios y admite una sola respuesta web", async () => {
    const { orden, solicitud } = await presentarOferta();

    expect(await obtenerPresupuestoOrden(orden.id, new Date())).toMatchObject({
      estado: "PENDIENTE_APROBACION", total: "445.00", descuentoDiagnostico: "25.00", montoRecargo: "20.00",
    });
    expect(await responderPresupuestoWeb({ ...solicitud, decision: "APROBAR" })).toEqual({ guardada: true });
    expect(await responderPresupuestoWeb({ ...solicitud, decision: "RECHAZAR" }))
      .toEqual({ error: "Ya se registró una respuesta para esta versión." });
    expect(await db.orm.public.Presupuestos.firstOrThrow({ id: solicitud.presupuestoId }))
      .toMatchObject({ estado: "APROBADO", canalRespuesta: "WEB", fechaRespuesta: expect.any(Date), total: "445.00" });
    expect(await db.orm.public.Orden.firstOrThrow({ id: orden.id })).toMatchObject({
      estado: "APROBADO", fechaCierreTecnico: null,
    });
    const partidas = await db.orm.public.PresupuestoServicio.where({ presupuestoId: solicitud.presupuestoId })
      .select("servicioId", "estado").all();
    expect(partidas).toEqual(expect.arrayContaining([
      { servicioId: catalogo.diagnostico.id, estado: "FINALIZADO" },
      { servicioId: catalogo.reparacion.id, estado: "PENDIENTE_EJECUCION" },
    ]));
  });

  it("rechaza la reparación, libera el cupo y conserva el diagnóstico a tarifa completa", async () => {
    const { orden, solicitud } = await presentarOferta();

    expect(await responderPresupuestoWeb({ ...solicitud, decision: "RECHAZAR" })).toEqual({ guardada: true });
    expect(await db.orm.public.Presupuestos.firstOrThrow({ id: solicitud.presupuestoId }))
      .toMatchObject({ estado: "RECHAZADO", canalRespuesta: "WEB", fechaRespuesta: expect.any(Date) });
    const actual = await db.orm.public.Orden.firstOrThrow({ id: orden.id });
    expect(actual).toMatchObject({ estado: "RECHAZADO", fechaCierreTecnico: expect.any(Date) });
    expect(await calcularCobroEntrega(actual)).toEqual({
      operacion: "devolucion", estadoFinal: "RECHAZADO_ENTREGADO", monto: "50.00",
      partidas: [{ concepto: "Diagnóstico general", importe: "50.00" }],
    });
  });

  it.each(["consultar", "responder"] as const)("vence la oferta al %s y conserva la orden pendiente", async (operacion) => {
    const { orden, solicitud } = await presentarOferta();
    await db.orm.public.Presupuestos.where({ id: solicitud.presupuestoId })
      .update({ fechaVencimiento: new Date(Date.now() - diaMs) });

    if (operacion === "consultar") {
      expect(await obtenerPresupuestoOrden(orden.id, new Date())).toMatchObject({ estado: "VENCIDO" });
    } else {
      expect(await responderPresupuestoWeb({ ...solicitud, decision: "APROBAR" }))
        .toEqual({ error: "La oferta venció y ya no admite respuestas." });
    }

    expect(await db.orm.public.Presupuestos.firstOrThrow({ id: solicitud.presupuestoId }))
      .toMatchObject({ estado: "VENCIDO", fechaRespuesta: null, canalRespuesta: null });
    expect(await db.orm.public.Orden.firstOrThrow({ id: orden.id })).toMatchObject({
      estado: "PENDIENTE_APROBACION", fechaCierreTecnico: null,
    });
  });

  it("cobra una vez lo aprobado y excluye los adicionales rechazados o vencidos", async () => {
    const { orden, solicitud } = await presentarOferta();
    expect(await responderPresupuestoWeb({ ...solicitud, decision: "APROBAR" })).toEqual({ guardada: true });

    // Estados persistidos para comprobar el cobro de las versiones adicionales.
    await db.orm.public.Presupuestos.createAll([
      { ordenId: orden.id, tipo: "ADICIONAL", version: 2, estado: "RECHAZADO", total: "90.00" },
      { ordenId: orden.id, tipo: "ADICIONAL", version: 3, estado: "VENCIDO", total: "70.00" },
      { ordenId: orden.id, tipo: "ADICIONAL", version: 4, estado: "APROBADO", total: "80.00" },
    ]);
    await db.orm.public.Orden.where({ id: orden.id }).update({ estado: "LISTO", fechaCierreTecnico: new Date() });

    const lista = await db.orm.public.Orden.firstOrThrow({ id: orden.id });
    expect(await calcularCobroEntrega(lista)).toEqual({
      operacion: "entrega", estadoFinal: "ENTREGADO", monto: "525.00",
      partidas: [
        { concepto: "Presupuesto principal · Versión 1", importe: "445.00" },
        { concepto: "Presupuesto adicional · Versión 4", importe: "80.00" },
      ],
    });
    expect(await confirmarEntregaOrden(orden.id, catalogo.recepcion.id, "525.00")).toEqual({ registrada: true });
    expect(await confirmarEntregaOrden(orden.id, catalogo.recepcion.id, "525.00"))
      .toEqual({ error: "La entrega de esta orden ya fue registrada." });
    expect(await db.orm.public.Orden.firstOrThrow({ id: orden.id })).toMatchObject({
      estado: "ENTREGADO", montoCobrado: "525.00", entregadoPorId: catalogo.recepcion.id,
    });
  });
});
