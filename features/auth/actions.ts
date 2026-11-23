"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/src/prisma/db";
import { createSession, sessionCookieName, sessionDurationSeconds } from "@/lib/session";
import { verifyPassword } from "@/lib/password";

export type LoginState = {
  error?: string;
};

export async function login(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = formData.get("username");
  const password = formData.get("password");

  if (typeof username !== "string" || typeof password !== "string" || !username || !password) {
    return { error: "Ingresa tu usuario y contraseña." };
  }

  const user = await db.orm.public.Usuarios.where({ username }).first();

  if (!user || !user.activo || !(await verifyPassword(password, user.password))) {
    return { error: "Las credenciales no son válidas." };
  }

  const session = await createSession(user.id, user.rol);
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, session.value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: sessionDurationSeconds,
    expires: session.expiresAt,
    path: "/",
  });

  redirect("/dashboard");
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
  redirect("/login");
}