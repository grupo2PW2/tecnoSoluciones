"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";

export type FormState = {
  error?: string;
  success?: string;
};

function getText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function occupiesTechnicalCapacity(estado: string, trabajoVerficado: boolean) {
  return (
    estado !== "ENTREGADO" &&
    !(estado === "LISTO_PARA_ENTREGA" && trabajoVerficado)
  );
}

export async function assignOrder(formData: FormData) {
  const user = await requireUser();
  const orderId = Number(getText(formData, "ordenId"));

  if (user.rol !== "TECNICO" || !Number.isInteger(orderId) || orderId < 1) {
    return;
  }

  try {
    await db.transaction(async (tx) => {
      await tx.orm.public.Usuarios.where({ id: user.id }).forUpdate().first();
      const assignedOrders = await tx.orm.public.Orden
        .where({ tecnicoId: user.id })
        .select("estado", "trabajoVerficado")
        .all();
      const activeOrders = assignedOrders.filter((order) =>
        occupiesTechnicalCapacity(order.estado, order.trabajoVerficado),
      );

      if (activeOrders.length >= 2) {
        throw new Error("CAPACITY_REACHED");
      }

      const order = await tx.orm.public.Orden
        .where({ id: orderId })
        .forUpdate()
        .first();

      if (!order || order.tecnicoId !== null) {
        throw new Error("ORDER_UNAVAILABLE");
      }

      await tx.orm.public.Orden.where({ id: orderId }).update({
        tecnicoId: user.id,
        estado: "EN_PROCESO",
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "CAPACITY_REACHED") {
      return;
    }

    return;
  }

  revalidatePath("/diagnosticos");
  revalidatePath("/ordenes");
}

export async function saveDiagnosis(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const orderId = Number(getText(formData, "ordenId"));
  const diagnostico = getText(formData, "diagnostico");

  if (!Number.isInteger(orderId) || orderId < 1 || !diagnostico) {
    return { error: "Escribe el diagnóstico de la orden." };
  }

  const order = await db.orm.public.Orden.first({ id: orderId });

  if (!order) {
    return { error: "La orden seleccionada no existe." };
  }

  if (order.estadoPago === "PAGADO" || order.estado === "ENTREGADO") {
    return { error: "La orden ya está pagada o entregada y no admite cambios técnicos." };
  }

  if (user.rol !== "ADMINISTRADOR" && (user.rol !== "TECNICO" || order.tecnicoId !== user.id)) {
    return { error: "Solo el técnico responsable puede modificar este diagnóstico." };
  }

  await db.orm.public.Orden.where({ id: orderId }).update({
    diagnostico,
    estado: "DIAGNOSTICADO",
  });
  revalidatePath("/diagnosticos");
  revalidatePath("/ordenes");
  return { success: "Diagnóstico guardado correctamente." };
}

function normalizePrice(value: string) {
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const price = Number(value);
  return Number.isFinite(price) && price >= 0 && price <= 99_999_999.99
    ? price.toFixed(2)
    : null;
}

async function requireTechnicalAccess(orderId: number) {
  const user = await requireUser();
  const order = await db.orm.public.Orden.first({ id: orderId });

  if (!order) {
    throw new Error("ORDER_NOT_FOUND");
  }

  if (user.rol !== "ADMINISTRADOR" && (user.rol !== "TECNICO" || order.tecnicoId !== user.id)) {
    throw new Error("FORBIDDEN");
  }

  return order;
}

export async function saveActivity(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const orderId = Number(getText(formData, "ordenId"));
  const serviceId = Number(getText(formData, "servicioId"));
  const price = normalizePrice(getText(formData, "precioUnitario"));
  const observations = getText(formData, "observaciones");

  if (!Number.isInteger(orderId) || orderId < 1 || !Number.isInteger(serviceId) || serviceId < 1 || !price) {
    return { error: "Completa el servicio y un precio válido." };
  }

  try {
    const order = await requireTechnicalAccess(orderId);

    if (["PENDIENTE_APROBACION", "RECHAZADO", "ENTREGADO"].includes(order.estado)) {
      return { error: "La orden no permite registrar trabajo técnico en su estado actual." };
    }

    if (order.estadoPago === "PAGADO") {
      return { error: "La orden ya está pagada y no admite nuevas actividades." };
    }

    const service = await db.orm.public.Servicios.first({ id: serviceId });

    if (!service) {
      return { error: "El servicio seleccionado no existe." };
    }

    await db.orm.public.Actividades.create({
      fechaInicio: new Date(),
      fechaFinalizacion: new Date(),
      estado: "FINALIZADO",
      observaciones: observations || null,
      precioUnitario: price,
      ordenId,
      servicioId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return { error: "La orden seleccionada no existe." };
    }
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { error: "Solo el técnico responsable puede registrar actividades." };
    }
    return { error: "No se pudo registrar la actividad." };
  }

  revalidatePath("/diagnosticos");
  return { success: "Actividad registrada correctamente." };
}

export async function completeTechnicalWork(formData: FormData) {
  const orderId = Number(getText(formData, "ordenId"));

  if (!Number.isInteger(orderId) || orderId < 1) return;

  try {
    const order = await requireTechnicalAccess(orderId);
    const activities = await db.orm.public.Actividades.where({ ordenId }).select("id").all();

    if (activities.length === 0 || order.estado === "ENTREGADO" || order.estadoPago === "PAGADO") return;

    await db.orm.public.Orden.where({ id: orderId }).update({
      estado: "LISTO_PARA_ENTREGA",
      trabajoVerficado: true,
      fechaFinalizacion: new Date(),
    });
    revalidatePath("/diagnosticos");
    revalidatePath("/ordenes");
  } catch {
    return;
  }
}

export async function registerPartConsumption(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const orderId = Number(getText(formData, "ordenId"));
  const partId = Number(getText(formData, "repuestoId"));
  const quantityValue = getText(formData, "cantidad");
  const quantity = /^\d+$/.test(quantityValue) ? Number(quantityValue) : 0;

  if (
    !Number.isInteger(orderId) ||
    orderId < 1 ||
    !Number.isInteger(partId) ||
    partId < 1 ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1
  ) {
    return { error: "Selecciona un repuesto y una cantidad válida." };
  }

  try {
    const user = await requireUser();

    await db.transaction(async (tx) => {
      const order = await tx.orm.public.Orden.where({ id: orderId }).forUpdate().first();

      if (!order || (user.rol !== "ADMINISTRADOR" && (user.rol !== "TECNICO" || order.tecnicoId !== user.id))) {
        throw new Error("FORBIDDEN");
      }

      if (!["EN_PROCESO", "EN_REPARACION"].includes(order.estado) || order.estadoPago === "PAGADO") {
        throw new Error("ORDER_STATE");
      }

      const part = await tx.orm.public.Repuestos.first({ id: partId });
      const inventory = await tx.orm.public.Inventario.where({ repuestoId: partId }).forUpdate().first();

      if (!part || !inventory || inventory.stock < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const movement = await tx.orm.public.Movimientos.create({
        tipo: "SALIDA_REPARACION",
        observaciones: `Consumo de reparación ${order.codigo}`,
        ordenId,
      });
      await tx.orm.public.DetalleMovimientos.create({
        cantidad: quantity,
        costoUnitario: part.costoActual,
        precioUnitario: part.precioReferencial,
        movimientoId: movement.id,
        repuestoId: partId,
      });
      await tx.orm.public.Inventario.where({ repuestoId: partId }).update({
        stock: inventory.stock - quantity,
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "FORBIDDEN") {
      return { error: "Solo el técnico responsable puede consumir repuestos." };
    }
    if (error instanceof Error && error.message === "ORDER_STATE") {
      return { error: "La orden no está en ejecución técnica." };
    }
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return { error: "No hay stock suficiente para este consumo." };
    }
    return { error: "No se pudo registrar el consumo." };
  }

  revalidatePath("/diagnosticos");
  revalidatePath("/inventario");
  revalidatePath("/movimientos");
  return { success: "Repuesto consumido correctamente." };
}