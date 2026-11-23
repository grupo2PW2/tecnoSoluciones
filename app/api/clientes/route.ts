import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { puedeRegistrarIngreso } from "@/features/ordenes/modelo";

import { normalizarFiltros } from "@/features/clientes/filters";

import { obtenerClientesPaginados } from "@/features/clientes/queries";

export async function GET(request: NextRequest) {
  try {
    const usuario = await getCurrentUser();
    if (!puedeRegistrarIngreso(usuario?.rol)) {
      return NextResponse.json({ message: "Tu usuario no tiene permiso para consultar clientes." }, { status: usuario ? 403 : 401 });
    }

    const { searchParams } = request.nextUrl;

    const filtros = normalizarFiltros(
      searchParams.get("buscar") ?? undefined,
      searchParams.get("page") ?? undefined,
    );

    const resultado = await obtenerClientesPaginados(filtros);

    return NextResponse.json(resultado);
  } catch (error) {
    console.error("Error al consultar clientes:", error);

    return NextResponse.json(
      { message: "No se pudieron obtener los clientes." },
      { status: 500 },
    );
  }
}
