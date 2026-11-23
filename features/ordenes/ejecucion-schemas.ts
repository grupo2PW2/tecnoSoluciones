
import { z } from "zod";
import { idSchema } from "./schemas";

const partida = { ordenId: idSchema, presupuestoId: idSchema, servicioId: idSchema };
const observaciones = z.string().trim().min(1, "Describe el trabajo realizado o el resultado de la prueba.").max(4000);

export const ejecucionSchema = z.discriminatedUnion("operacion", [
  z.object({ ...partida, operacion: z.literal("iniciar") }),
  z.object({ ...partida, operacion: z.literal("guardar"), observaciones }),
  z.object({
    ...partida,
    operacion: z.literal("finalizar"),
    observaciones,
    verificado: z.literal(true, { error: "Confirma que verificaste el servicio." }),
  }),
  z.object({ ordenId: idSchema, operacion: z.literal("listo") }),
]);

export type SolicitudEjecucion = z.infer<typeof ejecucionSchema>;
