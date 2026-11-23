export function puedeConsultarReportes(rol?: string) {
  return rol === "GERENTE" || rol === "ADMINISTRADOR";
}
