export const rolesUsuario = {
  ADMINISTRADOR: "Administración",
  TECNICO: "Técnico",
  RECEPCIONISTA: "Recepción",
  GERENTE: "Gerencia",
} as const;

export type RolUsuario = keyof typeof rolesUsuario;

export function normalizarBusquedaUsuario(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-BO");
}
