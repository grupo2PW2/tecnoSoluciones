import {
  ArrowLeftRightIcon, BoxesIcon, ChartColumnIcon, ClipboardListIcon, ContactIcon, LayoutDashboardIcon,
  MonitorSmartphoneIcon, PackageIcon, SettingsIcon, UsersIcon, WrenchIcon,
} from "lucide-react";
import type { RutaPanel } from "../navegacion";

const iconos = {
  "/dashboard": LayoutDashboardIcon,
  "/ordenes": ClipboardListIcon,
  "/reportes": ChartColumnIcon,
  "/clientes": ContactIcon,
  "/dispositivos": MonitorSmartphoneIcon,
  "/inventario": BoxesIcon,
  "/movimientos": ArrowLeftRightIcon,
  "/repuestos": PackageIcon,
  "/servicios": WrenchIcon,
  "/usuarios": UsersIcon,
  "/configuracion": SettingsIcon,
} satisfies Record<RutaPanel, typeof LayoutDashboardIcon>;

export function IconoRuta({ ruta, className }: { ruta: RutaPanel; className?: string }) {
  const Icono = iconos[ruta];
  return <Icono className={className} aria-hidden="true" />;
}
