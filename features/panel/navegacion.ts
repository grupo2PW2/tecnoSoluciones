import { puedeConsultarOrdenes, puedeRegistrarIngreso, puedeTomarOrdenes } from "@/features/ordenes/modelo";
import { puedeConsultarReportes } from "@/features/reportes/modelo";
import type { RolUsuario } from "@/features/usuarios/modelo";

export const titulosPanel = {
  "/dashboard": "Inicio",
  "/ordenes": "Órdenes de servicio",
  "/reportes": "Reportes",
  "/clientes": "Clientes",
  "/dispositivos": "Dispositivos",
  "/inventario": "Inventario",
  "/movimientos": "Movimientos",
  "/repuestos": "Repuestos",
  "/servicios": "Servicios",
  "/usuarios": "Usuarios",
  "/configuracion": "Configuración",
};

export type RutaPanel = keyof typeof titulosPanel;
export type GrupoPanel = { titulo: string; rutas: RutaPanel[] };

export function gruposPanel(rol: RolUsuario): GrupoPanel[] {
  const grupos: GrupoPanel[] = [];
  if (puedeConsultarOrdenes(rol) || puedeTomarOrdenes(rol)) {
    grupos.push({ titulo: "Servicio técnico", rutas: ["/ordenes"] });
  }
  if (puedeConsultarReportes(rol)) {
    grupos.push({ titulo: "Gerencia", rutas: ["/reportes"] });
  }
  if (puedeRegistrarIngreso(rol)) {
    grupos.push({ titulo: "Recepción", rutas: ["/clientes", "/dispositivos"] });
    grupos.push({ titulo: "Existencias", rutas: ["/inventario", "/movimientos", "/repuestos"] });
  }
  if (rol === "ADMINISTRADOR") {
    grupos.push({ titulo: "Administración", rutas: ["/servicios", "/usuarios", "/configuracion"] });
  }
  return grupos;
}

export function rutaActiva(pathname: string, ruta: RutaPanel) {
  return pathname === ruta || pathname.startsWith(ruta + "/");
}

export function seccionesRuta(pathname: string): { titulo: string; ruta?: RutaPanel }[] {
  if (pathname === "/dashboard") return [{ titulo: titulosPanel["/dashboard"] }];

  const ruta = (Object.keys(titulosPanel) as RutaPanel[]).find((base) => rutaActiva(pathname, base));
  const inicio = { titulo: titulosPanel["/dashboard"], ruta: "/dashboard" as const };
  if (!ruta) return [inicio, { titulo: pathname === "/diagnosticos" ? "Diagnósticos" : "Panel" }];
  const detalle = pathname !== ruta && (ruta === "/clientes" || ruta === "/ordenes");
  const modulo = { titulo: titulosPanel[ruta], ruta: detalle ? ruta : undefined };
  return detalle
    ? [inicio, modulo, { titulo: ruta === "/clientes" ? "Ficha del cliente" : "Detalle de la orden" }]
    : [inicio, modulo];
}
