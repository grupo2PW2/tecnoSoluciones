"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

const priorities = ["BAJA", "MEDIA", "ALTA"] as const;
type Priority = (typeof priorities)[number];

export type FormState = {
  error?: string;
  success?: string;
};

function getText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isPriority(value: string): value is Priority {
  return priorities.includes(value as Priority);
}

async function requireReceptionAccess() {
  const user = await requireUser();

  if (user.rol !== "ADMINISTRADOR" && user.rol !== "RECEPCIONISTA") {
    throw new Error("FORBIDDEN");
  }

  return user;
}

export async function createOrder(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  let receptionist;

  try {
    receptionist = await requireReceptionAccess();
  } catch {
    return { error: "No tienes permisos para registrar órdenes." };
  }

  const clientId = Number(getText(formData, "clienteId"));
  const deviceId = Number(getText(formData, "dispositivoId"));
  const serviceId = Number(getText(formData, "servicioId"));
  const problemasReportados = getText(formData, "problemasReportados");
  const condicionDispositivo = getText(formData, "condicionDispositivo");
  const accesoriosRecibidos = getText(formData, "accesoriosRecibidos");
  const prioridad = getText(formData, "prioridad");
  const fechaEstimadaValue = getText(formData, "fechaEstimada");
  const observaciones = getText(formData, "observaciones");

  if (
    !Number.isInteger(clientId) ||
    clientId < 1 ||
    !Number.isInteger(deviceId) ||
    deviceId < 1 ||
    !Number.isInteger(serviceId) ||
    serviceId < 1 ||
    !problemasReportados ||
    !isPriority(prioridad)
  ) {
    return { error: "Completa el cliente, dispositivo, servicio, problema y prioridad." };
  }

  const fechaEstimada = fechaEstimadaValue ? new Date(`${fechaEstimadaValue}T23:59:59`) : null;

  if (fechaEstimada && Number.isNaN(fechaEstimada.getTime())) {
    return { error: "La fecha estimada no es válida." };
  }

  const [client, device, service] = await Promise.all([
    db.orm.public.Clientes.first({ id: clientId }),
    db.orm.public.Dispositivos.first({ id: deviceId }),
    db.orm.public.Servicios.first({ id: serviceId }),
  ]);

  if (!client || !device || !service || device.clienteId !== clientId) {
    return { error: "La relación entre cliente, dispositivo y servicio no es válida." };
  }

  if (!service.activo) {
    return { error: "El servicio seleccionado está inactivo." };
  }

  try {
    const order = await db.transaction(async (tx) => {
      const createdOrder = await tx.orm.public.Orden.create({
        codigo: `TMP-${randomUUID()}`,
        codigoCliente: randomUUID(),
        problemasReportados,
        condicionDispositivo: condicionDispositivo || null,
        accesoriosRecibidos: accesoriosRecibidos || null,
        prioridad,
        fechaEstimada,
        observaciones: observaciones || null,
        recepcionistaId: receptionist.id,
        dispositivoId: deviceId,
        servicioSolicitadoId: serviceId,
      });
      const codigo = `ORD-${String(createdOrder.id).padStart(6, "0")}`;

      return tx.orm.public.Orden.where({ id: createdOrder.id }).update({ codigo });
    });

    revalidatePath("/ordenes");
    return {
      success: `Orden ${order.codigo} creada. Código privado: ${order.codigoCliente}`,
    };
  } catch {
    return { error: "No se pudo registrar la orden." };
  }
}

const paymentMethods = ["EFECTIVO", "TARJETA", "QR"] as const;
type PaymentMethod = (typeof paymentMethods)[number];

function isPaymentMethod(value: string): value is PaymentMethod {
  return paymentMethods.includes(value as PaymentMethod);
}

function normalizeDiscount(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const discount = Number(value);
  return Number.isFinite(discount) && discount >= 0 ? discount.toFixed(2) : null;
}

export async function registerPayment(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await requireReceptionAccess();
  } catch {
    return { error: "No tienes permisos para registrar pagos." };
  }

  const orderId = Number(getText(formData, "ordenId"));
  const method = getText(formData, "metodoPago");
  const discount = normalizeDiscount(getText(formData, "descuentoAplicado"));

  if (!Number.isInteger(orderId) || orderId < 1 || !isPaymentMethod(method) || !discount) {
    return { error: "Completa el método de pago y un descuento válido." };
  }

  try {
    await db.transaction(async (tx) => {
      const order = await tx.orm.public.Orden.where({ id: orderId }).forUpdate().first();

      if (!order || order.estado !== "LISTO_PARA_ENTREGA" || !order.trabajoVerficado || order.estadoPago === "PAGADO") {
        throw new Error("ORDER_NOT_PAYABLE");
      }

      const activities = await tx.orm.public.Actividades.where({ ordenId: orderId }).select("estado", "precioUnitario").all();
      const movements = await tx.orm.public.Movimientos
        .where({ ordenId: orderId, tipo: "SALIDA_REPARACION" })
        .include("detalleMovimientos", (detail) => detail.select("cantidad", "precioUnitario"))
        .all();
      const servicesTotal = activities
        .filter((activity) => activity.estado === "FINALIZADO")
        .reduce((total, activity) => total + Number(activity.precioUnitario), 0);
      const partsTotal = movements.reduce(
        (total, movement) => total + movement.detalleMovimientos.reduce(
          (subtotal, detail) => subtotal + detail.cantidad * Number(detail.precioUnitario ?? 0),
          0,
        ),
        0,
      );
      const subtotal = servicesTotal + partsTotal;
      const discountValue = Number(discount);

      if (discountValue > subtotal) {
        throw new Error("DISCOUNT_TOO_LARGE");
      }

      await tx.orm.public.Orden.where({ id: orderId }).update({
        descuentoAplicado: discount,
        estadoPago: "PAGADO",
        metodoPago: method,
        fechaPago: new Date(),
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "DISCOUNT_TOO_LARGE") {
      return { error: "El descuento no puede superar el subtotal." };
    }
    return { error: "La orden no está disponible para pago o no se pudo calcular el importe." };
  }

  revalidatePath("/ordenes");
  return { success: "Pago registrado correctamente." };
}

export async function confirmDelivery(formData: FormData) {
  try {
    await requireReceptionAccess();
  } catch {
    return;
  }

  const orderId = Number(getText(formData, "ordenId"));

  if (!Number.isInteger(orderId) || orderId < 1) return;

  await db.transaction(async (tx) => {
    const order = await tx.orm.public.Orden.where({ id: orderId }).forUpdate().first();

    if (!order || order.estadoPago !== "PAGADO" || order.estado !== "LISTO_PARA_ENTREGA") {
      return;
    }

    await tx.orm.public.Orden.where({ id: orderId }).update({
      entregaConfirmada: true,
      fechaEntrega: new Date(),
      estado: "ENTREGADO",
    });
  });

  revalidatePath("/ordenes");
}