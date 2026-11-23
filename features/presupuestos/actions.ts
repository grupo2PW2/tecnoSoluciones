
"use server";

import { puedeRegistrarIngreso, puedeTomarOrdenes } from "@/features/ordenes/modelo";
import { getCurrentUser } from "@/lib/auth";
import { presupuestoSchema, type SolicitudPresupuesto } from "./schemas";
import { idSchema } from "@/features/ordenes/schemas";
import { cotizadorParaUsuario } from "./permisos-cotizacion";
import { crearBorradorDirecto, guardarCotizacion, registrarServicioEnCotizacion } from "./servicio";

export async function registrarServicioParaPresupuesto(ordenId: number, presupuestoId: number, formulario: FormData) {
  const usuario = await getCurrentUser();
  if (!usuario || !puedeTomarOrdenes(usuario.rol)) {
    return { error: "Tu usuario no tiene permiso para registrar servicios en esta cotización." };
  }
  if (!idSchema.safeParse(ordenId).success || !idSchema.safeParse(presupuestoId).success) {
    return { error: "Selecciona un presupuesto válido." };
  }

  return registrarServicioEnCotizacion(ordenId, presupuestoId, usuario.id, formulario);
}

export async function iniciarPresupuestoDirecto(ordenId: number) {
  const usuario = await getCurrentUser();
  if (!puedeRegistrarIngreso(usuario?.rol)) {
    return { error: "Tu usuario no tiene permiso para cotizar servicios directos." };
  }
  const resultado = idSchema.safeParse(ordenId);
  if (!resultado.success) return { error: "Selecciona una orden válida." };

  try {
    return await crearBorradorDirecto(resultado.data);
  } catch (error) {
    console.error("Error al iniciar un presupuesto directo:", error);
    return { error: "No se pudo crear el borrador. Inténtalo nuevamente." };
  }
}

export async function guardarPresupuesto(solicitud: SolicitudPresupuesto) {
  const cotizador = cotizadorParaUsuario(await getCurrentUser());
  if (!cotizador) {
    return { error: "Tu usuario no tiene permiso para preparar esta cotización." };
  }

  const resultado = presupuestoSchema.safeParse(solicitud);
  if (!resultado.success) return { error: resultado.error.issues[0].message };

  try {
    return await guardarCotizacion(resultado.data, cotizador);
  } catch (error) {
    console.error("Error al guardar presupuesto:", error);
    return { error: "No se pudo guardar el presupuesto. Inténtalo nuevamente." };
  }
}
