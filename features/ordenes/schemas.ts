
import { z } from "zod";
import { estadosOrden, tiposIngreso } from "./modelo";

export const estadoOrdenSchema = z.enum(Object.keys(estadosOrden) as (keyof typeof estadosOrden)[]);

export const idSchema = z.number().int().positive().max(2147483647);

export const ingresoSchema = z.object({
  solicitud: z.uuid("Vuelve a abrir el formulario e intenta nuevamente."),
  clienteId: idSchema,
  dispositivoId: idSchema,
  tecnicoId: idSchema.nullish(),
  tipoIngreso: z.enum(Object.keys(tiposIngreso) as (keyof typeof tiposIngreso)[], {
    error: "Selecciona el tipo de ingreso.",
  }),
  problemasReportados: z.string().trim().min(1, "Escribe el motivo de ingreso.").max(2000),
  condicionDispositivo: z.string().trim().max(1000),
  accesoriosRecibidos: z.string().trim().max(1000),
});

export type DatosIngreso = z.infer<typeof ingresoSchema>;

const hallazgosDiagnostico = z.string().trim().min(1, "Escribe los hallazgos del diagnóstico.").max(4000);

export const diagnosticoSchema = z.discriminatedUnion("operacion", [
  z.object({ ordenId: idSchema, operacion: z.literal("iniciar") }),
  z.object({ ordenId: idSchema, operacion: z.literal("guardar"), hallazgos: hallazgosDiagnostico }),
  z.object({
    ordenId: idSchema,
    operacion: z.literal("finalizar"),
    hallazgos: hallazgosDiagnostico,
    verificado: z.literal(true, { error: "Confirma que verificaste los hallazgos." }),
  }),
]);

export type SolicitudDiagnostico = z.infer<typeof diagnosticoSchema>;

