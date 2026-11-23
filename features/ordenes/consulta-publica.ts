"use server";

import { redirect } from "next/navigation";
import { obtenerSeguimiento } from "./queries";

export async function consultarOrdenPublica(_estado: { error: string }, formulario: FormData) {
  const entrada = formulario.get("codigo");
  const codigo = typeof entrada === "string" ? entrada.trim() : "";
  if (!codigo) return { error: "Ingresa el código que aparece en tu ticket." };
  if (codigo.length > 128 || codigo === "." || codigo === ".." || /[\u0000-\u001f\u007f]/.test(codigo)) {
    return { error: "Revisa el código impreso en tu ticket." };
  }

  let encontrado: string | null = null;
  try {
    if (await obtenerSeguimiento(codigo)) {
      encontrado = codigo;
    } else {
      const compacto = codigo.replace(/[\s-]/g, "").toLowerCase();
      if (compacto !== codigo && /^[a-f0-9]{32}$/.test(compacto) && await obtenerSeguimiento(compacto)) {
        encontrado = compacto;
      }
    }
  } catch (error) {
    console.error("Error al consultar una orden pública:", error);
    return { error: "No pudimos consultar la orden. Inténtalo nuevamente." };
  }

  if (!encontrado) return { error: "No encontramos una orden con ese código. Verifica el código impreso en tu ticket." };
  redirect("/orden/" + encodeURIComponent(encontrado));
}
