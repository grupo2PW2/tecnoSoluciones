'use client'

import { SearchForm } from "@/components/search-form"
import { logout } from "@/app/(auth)/login/actions"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"
import { LogOut, PanelLeftIcon } from "lucide-react"

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const pathname = usePathname()
  const breadcrumb = getBreadcrumb(pathname)

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button
          className="h-8 w-8"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
        >
          <PanelLeftIcon
          />
        </Button>
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Panel</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{breadcrumb}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
        <form action={logout}>
          <Button className="h-8 w-8" variant="ghost" size="icon" type="submit" title="Cerrar sesión">
            <LogOut />
          </Button>
        </form>
      </div>
    </header>
  )
}

function getBreadcrumb(pathname: string) {
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    clientes: "Clientes",
    dispositivos: "Dispositivos",
    ordenes: "Órdenes",
    diagnosticos: "Diagnósticos",
    presupuestos: "Presupuestos",
    servicios: "Servicios",
    repuestos: "Repuestos",
    inventario: "Inventario",
    movimientos: "Movimientos",
    usuarios: "Usuarios",
  }
  const segment = pathname.split("/").filter(Boolean)[0]
  return segment ? labels[segment] ?? "Panel" : "Dashboard"
}
