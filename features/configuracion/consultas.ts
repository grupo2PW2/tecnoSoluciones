import "server-only";

import { db } from "@/src/prisma/db";

export async function consultarConfiguracionGanancia(tx: Pick<typeof db, "orm"> = db) {
  return tx.orm.public.Configuracion.select("id", "margenGanancia", "updatedAt")
    .orderBy([(fila) => fila.updatedAt.desc(), (fila) => fila.id.desc()]).first();
}

export async function consultarGananciaSobreCosto(tx: Pick<typeof db, "orm"> = db) {
  return (await consultarConfiguracionGanancia(tx))?.margenGanancia ?? "0.00";
}

export async function bloquearConfiguracionGanancia(tx: Pick<typeof db, "execute">, acceso: "lectura" | "escritura") {
  // Las entradas leen el margen y actualizan el costo en la misma transacción.
  const bloqueo = acceso === "lectura"
    ? db.raw.sql`LOCK TABLE "public"."Configuracion" IN SHARE MODE`
    : db.raw.sql`LOCK TABLE "public"."Configuracion" IN SHARE ROW EXCLUSIVE MODE`;
  await tx.execute(bloqueo.affectedCount().build());
}
