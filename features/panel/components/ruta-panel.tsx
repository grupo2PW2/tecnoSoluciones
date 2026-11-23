"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";
import {
  Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { seccionesRuta } from "../navegacion";

export function RutaPanel() {
  const pathname = usePathname();
  const secciones = seccionesRuta(pathname);

  return <Breadcrumb aria-label="Ruta de navegación" className="min-w-0">
    <BreadcrumbList>
      {secciones.map(({ titulo, ruta }, indice) => <Fragment key={titulo}>
        {indice > 0 && <BreadcrumbSeparator />}
        <BreadcrumbItem>
          {ruta
            ? <BreadcrumbLink render={<Link href={ruta} />}>{titulo}</BreadcrumbLink>
            : <BreadcrumbPage className="font-semibold">{titulo}</BreadcrumbPage>}
        </BreadcrumbItem>
      </Fragment>)}
    </BreadcrumbList>
  </Breadcrumb>;
}
