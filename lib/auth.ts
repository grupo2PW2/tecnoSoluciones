import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/src/prisma/db";
import { sessionCookieName, verifySession } from "@/lib/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = await verifySession(cookieStore.get(sessionCookieName)?.value);

  if (!session) {
    return null;
  }

  const user = await db.orm.public.Usuarios.first({ id: session.userId });

  if (!user || !user.activo) {
    return null;
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}