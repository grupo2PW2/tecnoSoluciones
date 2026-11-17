import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { sessionCookieName, verifySession } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const session = await verifySession(request.cookies.get(sessionCookieName)?.value);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/buscar/:path*", "/dashboard/:path*", "/clientes/:path*", "/diagnosticos/:path*", "/dispositivos/:path*", "/inventario/:path*", "/movimientos/:path*", "/ordenes/:path*", "/presupuestos/:path*", "/repuestos/:path*", "/servicios/:path*", "/usuarios/:path*"],
};