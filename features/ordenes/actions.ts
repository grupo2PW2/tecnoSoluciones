
"use server";

import { createHmac } from "node:crypto";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/src/prisma/db";
import { puedeRegistrarIngreso, puedeTomarOrdenes } from "./modelo";
import { asignarOrdenDisponible, validarCupoTecnico } from "./asignacion";
import { obtenerTicket } from "./queries";
import { idSchema, ingresoSchema, type DatosIngreso } from "./schemas";

const sinPermiso = { error: "Tu usuario no tiene permiso para realizar esta operación." };

export async function registrarIngreso(datos: DatosIngreso) {
  const usuario = await getCurrentUser();
  if (!usuario || !puedeRegistrarIngreso(usuario.rol)) return sinPermiso;

  const resultado = ingresoSchema.safeParse(datos);
  if (!resultado.success) return { error: resultado.error.issues[0].message };

  const { solicitud, clienteId, dispositivoId, tecnicoId, tipoIngreso, problemasReportados,
    condicionDispositivo, accesoriosRecibidos } = resultado.data;

  // La misma solicitud de este usuario conserva el código si se reintenta el envío.
  const codigoCliente = createHmac("sha256", process.env.SESSION_SECRET!)
    .update("ingreso:" + usuario.id + ":" + solicitud)
    .digest("hex").slice(0, 32);
  const previo = () => db.orm.public.Orden.select("id").first({ codigoCliente, recepcionistaId: usuario.id });

  try {
    const existente = await previo();
    const registro = existente ?? await db.transaction(async (tx) => {
      const equipo = await tx.orm.public.Dispositivos
        .where({ id: dispositivoId, clienteId }).select("id").forShare().first();
      if (!equipo) return { error: "Selecciona un equipo que pertenezca al cliente elegido." };

      if (tecnicoId != null) {
        const error = await validarCupoTecnico(tx, tecnicoId);
        if (error) return { error };
      }

      const orden = await tx.orm.public.Orden.select("id").create({
        codigo: "ingreso-" + codigoCliente,
        codigoCliente,
        dispositivoId,
        recepcionistaId: usuario.id,
        tecnicoId: tecnicoId ?? null,
        tipoIngreso,
        problemasReportados,
        condicionDispositivo: condicionDispositivo || null,
        accesoriosRecibidos: accesoriosRecibidos || null,
      });
      await tx.orm.public.Orden.where({ id: orden.id }).update({
        codigo: "OS-" + String(orden.id).padStart(6, "0"),
      });
      return orden;
    });

    const confirmado = "error" in registro ? await previo() : registro;
    if (!confirmado) return { error: "error" in registro ? registro.error : "No se pudo confirmar el ingreso." };
    const ticket = await obtenerTicket(confirmado.id);
    return ticket ? { ticket } : { error: "La orden se guardó. Vuelve a intentar para abrir el ticket." };
  } catch (error) {
    // Una solicitud simultánea puede haber confirmado la orden primero.
    const existente = await previo().catch(() => null);
    const ticket = existente && await obtenerTicket(existente.id).catch(() => null);
    if (ticket) return { ticket };

    console.error("Error al registrar ingreso:", error);
    return { error: "No se pudo confirmar el ingreso. Inténtalo nuevamente." };
  }
}

export async function asignarTecnico(ordenId: number, tecnicoId: number) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) return sinPermiso;
  if (!idSchema.safeParse(ordenId).success || !idSchema.safeParse(tecnicoId).success) {
    return { error: "Selecciona una orden y un técnico válidos." };
  }

  try {
    return await asignarOrdenDisponible(ordenId, tecnicoId);
  } catch (error) {
    console.error("Error al asignar técnico:", error);
    return { error: "No se pudo asignar el técnico. Inténtalo nuevamente." };
  }
}

export async function tomarOrden(ordenId: number) {
  const usuario = await getCurrentUser();
  if (!usuario || !puedeTomarOrdenes(usuario.rol)) return sinPermiso;
  if (!idSchema.safeParse(ordenId).success) return { error: "Selecciona una orden válida." };

  try {
    return await asignarOrdenDisponible(ordenId, usuario.id);
  } catch (error) {
    console.error("Error al tomar orden:", error);
    return { error: "No se pudo confirmar la toma de la orden. Inténtalo nuevamente." };
  }
}

export async function consultarTicket(id: number) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) return sinPermiso;
  if (!idSchema.safeParse(id).success) return { error: "El código de orden no es válido." };

  try {
    const ticket = await obtenerTicket(id);
    return ticket ? { ticket } : { error: "No se encontró el ticket de esta orden." };
  } catch (error) {
    console.error("Error al consultar ticket:", error);
    return { error: "No se pudo abrir el ticket. Inténtalo nuevamente." };
  }
}
