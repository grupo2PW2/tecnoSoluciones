import { Suspense, type ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { RutaPanel } from "@/features/panel/components/ruta-panel";
import { urlAvatar } from "@/features/usuarios/avatar";
import { requireUser } from "@/lib/auth";

async function PanelAutorizado({ children }: { children: ReactNode }) {
  const { id, nombre, apellido, username, avatar, rol } = await requireUser();

  return <SidebarProvider>
    <a href="#contenido-panel" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:p-2">
      Saltar al contenido
    </a>
    <AppSidebar usuario={{ nombre, apellido, username, avatar: urlAvatar(id, avatar), rol }} />
    <SidebarInset className="min-w-0">
      <header className="sticky top-0 z-10 flex min-h-14 shrink-0 items-center gap-2 border-b bg-background px-4 py-2 md:px-6">
        <SidebarTrigger className="-ml-1 shrink-0" />
        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
        <RutaPanel />
      </header>
      <main id="contenido-panel" tabIndex={-1} className="min-w-0 flex-1 focus:outline-none">{children}</main>
    </SidebarInset>
  </SidebarProvider>;
}

export default function PanelLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={<p role="status" className="p-6 text-muted-foreground">Cargando panel…</p>}>
    <PanelAutorizado>{children}</PanelAutorizado>
  </Suspense>;
}
