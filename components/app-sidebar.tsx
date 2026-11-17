"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  MonitorSmartphone,
  ClipboardList,
  Stethoscope,
  Wrench,
  Package,
  Warehouse,
  ArrowLeftRight,
  UserCog,
  ReceiptText,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navigation = [
  {
    title: "General",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Atención",
    items: [
      {
        title: "Clientes",
        url: "/clientes",
        icon: Users,
        allowedRoles: ["ADMINISTRADOR", "RECEPCIONISTA"],
      },
      {
        title: "Dispositivos",
        url: "/dispositivos",
        icon: MonitorSmartphone,
        allowedRoles: ["ADMINISTRADOR", "RECEPCIONISTA"],
      },
      {
        title: "Órdenes",
        url: "/ordenes",
        icon: ClipboardList,
        allowedRoles: ["ADMINISTRADOR", "RECEPCIONISTA"],
      },
    ],
  },
  {
    title: "Servicio técnico",
    items: [
      {
        title: "Diagnósticos",
        url: "/diagnosticos",
        icon: Stethoscope,
        allowedRoles: ["ADMINISTRADOR", "TECNICO"],
      },
      {
        title: "Presupuestos",
        url: "/presupuestos",
        icon: ReceiptText,
        allowedRoles: ["ADMINISTRADOR", "TECNICO"],
      },
      {
        title: "Servicios",
        url: "/servicios",
        icon: Wrench,
        allowedRoles: ["ADMINISTRADOR", "RECEPCIONISTA"],
      },
    ],
  },
  {
    title: "Almacén",
    items: [
      {
        title: "Repuestos",
        url: "/repuestos",
        icon: Package,
        allowedRoles: ["ADMINISTRADOR", "RECEPCIONISTA"],
      },
      {
        title: "Inventario",
        url: "/inventario",
        icon: Warehouse,
        allowedRoles: ["ADMINISTRADOR", "RECEPCIONISTA"],
      },
      {
        title: "Movimientos",
        url: "/movimientos",
        icon: ArrowLeftRight,
        allowedRoles: ["ADMINISTRADOR", "RECEPCIONISTA"],
      },
    ],
  },
  {
    title: "Administración",
    items: [
      {
        title: "Usuarios",
        url: "/usuarios",
        icon: UserCog,
        allowedRoles: ["ADMINISTRADOR"],
      },
    ],
  },
];

export function AppSidebar({
  role,
  ...props
}: React.ComponentProps<typeof Sidebar> & { role: string }) {
  const pathname = usePathname();

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/dashboard" />}
            >
              <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Wrench className="size-4" />
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  Tecno Soluciones
                </span>
                <span className="truncate text-xs">
                  Servicio técnico
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {navigation.map((group) => {
          const visibleItems = group.items.filter(
            (item) => !item.allowedRoles || item.allowedRoles.includes(role),
          );

          if (visibleItems.length === 0) {
            return null;
          }

          return (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>
              {group.title}
            </SidebarGroupLabel>

            <SidebarGroupContent>
              <SidebarMenu>
                {visibleItems.map((item) => {
                  const isActive =
                    pathname === item.url ||
                    pathname.startsWith(`${item.url}/`);

                  return (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        render={<Link href={item.url} />}
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          );
        })}
      </SidebarContent>
    </Sidebar>
  );
}