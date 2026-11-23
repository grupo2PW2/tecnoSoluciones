import type { Metadata } from "next";
import { InicioSeguimiento } from "@/features/ordenes/components/inicio-seguimiento";

export const metadata: Metadata = {
  title: "Consulta el estado de tu equipo",
  description: "Consulta el avance de tu orden de servicio de Tecno Soluciones con el código de tu ticket.",
};

export default function HomePage() {
  return <InicioSeguimiento />;
}
