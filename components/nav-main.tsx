"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { IconoRuta } from "@/features/panel/components/icono-ruta";
import { rutaActiva, titulosPanel, type GrupoPanel } from "@/features/panel/navegacion";

export function NavMain({ grupos }: { grupos: GrupoPanel[] }) {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const secciones: GrupoPanel[] = [{ titulo: "Panel", rutas: ["/dashboard"] }, ...grupos];

  return <nav aria-label="Menú principal" className="flex flex-col">
    {secciones.map(({ titulo, rutas }) => <SidebarGroup key={titulo}>
      <SidebarGroupLabel>{titulo}</SidebarGroupLabel>
      <SidebarMenu>
        {rutas.map((ruta) => {
          const activa = rutaActiva(pathname, ruta);
          return <SidebarMenuItem key={ruta}>
            <SidebarMenuButton isActive={activa} tooltip={titulosPanel[ruta]}
              render={<Link href={ruta} aria-current={activa ? (pathname === ruta ? "page" : "location") : undefined}
                onNavigate={() => setOpenMobile(false)} />}>
              <IconoRuta ruta={ruta} />
              <span>{titulosPanel[ruta]}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>;
        })}
      </SidebarMenu>
    </SidebarGroup>)}
  </nav>;
}
