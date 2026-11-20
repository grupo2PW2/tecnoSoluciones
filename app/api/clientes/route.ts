import { NextRequest, NextResponse } from "next/server";

import { normalizarFiltros } from "@/features/clientes/filters";

import { obtenerClientesPaginados } from "@/features/clientes/queries";

export async function GET(request: NextRequest) {
  try {
    // TODO: verificar sesión y permisos de lectura.

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
