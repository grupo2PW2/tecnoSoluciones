
import "server-only";

import { z } from "zod";
import { nombreDiagnosticoGeneral } from "@/features/ordenes/diagnostico-general";
import { db } from "@/src/prisma/db";
import { normalizarNombreServicio } from "./modelo";

const nombreSchema = z.string().trim().min(1, "Escribe el nombre del servicio.").max(120);

const fichaSchema = z.object({
  nombre: nombreSchema,
  descripcion: z.string().trim().max(500),
  precio: z.string().trim().regex(/^\d{1,8}([.,]\d{1,2})?$/, "Escribe un precio en Bs con hasta dos decimales."),
});

const altaSchema = fichaSchema.extend({
  nombre: nombreSchema.refine((nombre) => !esNombreReservado(nombre), "Diagnóstico general ya es un servicio del catálogo."),
});
const edicionSchema = fichaSchema.extend({ activo: z.enum(["true", "false"]).transform((valor) => valor === "true") });

type DatosAlta = z.infer<typeof altaSchema>;
type DatosEdicion = z.infer<typeof edicionSchema>;

function esNombreReservado(nombre: string) {
  return normalizarNombreServicio(nombre) === normalizarNombreServicio(nombreDiagnosticoGeneral);
}

function leerFicha(formulario: FormData) {
  return {
    nombre: formulario.get("nombre"),
    descripcion: formulario.get("descripcion") ?? "",
    precio: formulario.get("precio"),
  };
}

export function validarAltaServicio(formulario: FormData) {
  return altaSchema.safeParse(leerFicha(formulario));
}

export function validarEdicionServicio(formulario: FormData) {
  return edicionSchema.safeParse({ ...leerFicha(formulario), activo: formulario.get("activo") });
}

export function crearServicioCatalogo(tx: Pick<typeof db, "orm">, { nombre, descripcion, precio }: DatosAlta) {
  return tx.orm.public.Servicios.select("id", "nombre", "precioReferencial").create({
    nombre,
    descripcion: descripcion || null,
    precioReferencial: precio.replace(",", "."),
  });
}

export function editarServicioCatalogo(id: number, { nombre, descripcion, precio, activo }: DatosEdicion) {
  return db.transaction(async (tx) => {
    const servicio = await tx.orm.public.Servicios.where({ id }).select("nombre").forNoKeyUpdate().first();
    if (!servicio) return { error: "El servicio ya no está en el catálogo." } as const;

    if (servicio.nombre === nombreDiagnosticoGeneral) {
      if (nombre !== nombreDiagnosticoGeneral || !activo) {
        return { error: "Diagnóstico general debe conservar su nombre y mantenerse activo." } as const;
      }
    } else if (esNombreReservado(nombre)) {
      return { error: "Diagnóstico general es un nombre reservado del catálogo." } as const;
    }

    await tx.orm.public.Servicios.where({ id }).update({
      nombre, descripcion: descripcion || null, precioReferencial: precio.replace(",", "."), activo,
    });
    return { guardado: true } as const;
  });
}

export async function errorAltaServicio(nombre: string, error: unknown, servicioId?: number) {
  const existente = await db.orm.public.Servicios.select("id").first({ nombre }).catch(() => null);
  if (existente && existente.id !== servicioId) {
    return { error: "Ya existe un servicio con ese nombre. Selecciónalo en el catálogo." };
  }
  console.error("Error al guardar servicio:", error);
  return { error: "No se pudo guardar el servicio. Inténtalo nuevamente." };
}
