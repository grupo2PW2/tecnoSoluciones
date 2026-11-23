"use client";

import { useTransition } from "react";
import { ChevronsUpDownIcon, LogOutIcon } from "lucide-react";
import { AvatarUsuario } from "@/features/usuarios/components/avatar-usuario";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { logout } from "@/features/auth/actions";
import { rolesUsuario, type RolUsuario } from "@/features/usuarios/modelo";

export type UsuarioPanel = { nombre: string; apellido: string; username: string; avatar: string | null; rol: RolUsuario };

export function NavUser({ usuario }: { usuario: UsuarioPanel }) {
  const { isMobile } = useSidebar();
  const [cerrando, iniciarCierre] = useTransition();
  const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(" ");

  return <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger render={<SidebarMenuButton size="lg" aria-label={"Cuenta de " + nombre}
          className="aria-expanded:bg-sidebar-accent" />}>
          <AvatarUsuario nombre={usuario.nombre} apellido={usuario.apellido} src={usuario.avatar} />
          <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:sr-only">
            <span className="truncate font-semibold">{nombre}</span>
            <span className="truncate text-xs text-muted-foreground">{rolesUsuario[usuario.rol]}</span>
          </div>
          <ChevronsUpDownIcon className="ml-auto size-4 group-data-[collapsible=icon]:hidden" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-max max-w-[85vw]" side={isMobile ? "top" : "right"} align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <p className="truncate font-semibold text-foreground">{nombre}</p>
              <p className="truncate">{usuario.username} · {rolesUsuario[usuario.rol]}</p>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={cerrando} onClick={() => iniciarCierre(() => logout())}>
            <LogOutIcon aria-hidden="true" /> {cerrando ? "Cerrando sesión…" : "Cerrar sesión"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>;
}
