import type { RepuestoInventario } from "@/features/inventario/modelo";

export type EstadoRepuesto = RepuestoInventario["estado"];

export const modosEstadoRepuesto = ["SEGUN_EXISTENCIAS", "EN_REPOSICION", "DESCATALOGADO"] as const;

export const estadosRepuesto = {
  DISPONIBLE: "Disponible",
  AGOTADO: "Agotado",
  EN_REPOSICION: "En reposición",
  DESCATALOGADO: "Descatalogado",
} satisfies Record<EstadoRepuesto, string>;

export function estadoSegunExistencias(stock: number) {
  return stock > 0 ? "DISPONIBLE" : "AGOTADO";
}

export function estadoRepuesto({ estado, stock }: Pick<RepuestoInventario, "estado" | "stock">) {
  return estado === "DISPONIBLE" && stock <= 0 ? "AGOTADO" : estado;
}

export function normalizarBusquedaRepuesto(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-BO");
}
