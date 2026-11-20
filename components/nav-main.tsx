"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { ChevronRightIcon, LayoutDashboardIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";

type NavItem = {
  title: string;
  url: string;
  icon?: ReactNode;
  items?: {
    title: string;
    url: string;
  }[];
};

function isActivePath(pathname: string, url: string) {
  if (url === "#") return false;

  return pathname === url || pathname.startsWith(`${url}/`);
}

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Plataforma</SidebarGroupLabel>

      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={pathname === "/dashboard"}
            tooltip="Dashboard"
          >
            <LayoutDashboardIcon />
            <Link href="/dashboard">
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {items.map((item) => {
          const hasActiveChild =
            item.items?.some((subItem) =>
              isActivePath(pathname, subItem.url),
            ) ?? false;

          const isActive = isActivePath(pathname, item.url) || hasActiveChild;

          return (
            <Collapsible
              key={`${item.title}-${pathname}`}
              defaultOpen={isActive}
              className="group/collapsible"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                render={
                  <SidebarMenuButton tooltip={item.title} isActive={isActive} />
                }
              >
                {item.icon}
                <span>{item.title}</span>
                <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-open/collapsible:rotate-90" />
              </CollapsibleTrigger>

              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        isActive={isActivePath(pathname, subItem.url)}
                        render={
                          <Link href={subItem.url}>
                            <span>{subItem.title}</span>
                          </Link>
                        }
                      />
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
