import { connection } from "next/server";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { requireUser } from "@/lib/auth";

export const instant = false;

export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  await requireUser();

  return (
    <div className="[--header-height:calc(--spacing(14))]">
      <SidebarProvider className="flex flex-col">
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>
            <main>{children}</main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
