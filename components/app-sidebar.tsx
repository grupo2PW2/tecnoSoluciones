import { WrenchIcon } from "lucide-react";
import { NavMain } from "@/components/nav-main";
import { NavUser, type UsuarioPanel } from "@/components/nav-user";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@/components/ui/sidebar";
import { gruposPanel } from "@/features/panel/navegacion";

export function AppSidebar({ usuario }: { usuario: UsuarioPanel }) {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex min-w-0 items-center gap-2 p-1 group-data-[collapsible=icon]:p-0">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <WrenchIcon className="size-4" aria-hidden="true" />
          </span>
          <span className="truncate text-sm font-semibold group-data-[collapsible=icon]:sr-only">Tecno Soluciones</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain grupos={gruposPanel(usuario.rol)} />
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser usuario={usuario} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
