import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DialogoEquipo } from "@/features/dispositivos/components/dialogo-equipo";
import { TablaEquipos } from "@/features/dispositivos/components/tabla-equipos";
import type { EquipoFicha } from "@/features/dispositivos/queries";
import { textoCliente } from "@/features/ordenes/modelo";
import type { ClienteListado } from "../types";
import { DialogoCliente } from "./dialogo-cliente";

export function ClienteDetalle({ cliente, equipos }: { cliente: ClienteListado; equipos: EquipoFicha[] }) {
  return (
    <section className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <Link href="/clientes" className={buttonVariants({ variant: "link", size: "sm", className: "-ml-2" })}>Volver a Clientes</Link>
          <h1 className="break-words text-2xl font-semibold tracking-tight">{textoCliente(cliente)}</h1>
        </div>
        <DialogoCliente cliente={cliente} />
      </header>
      <Card>
        <CardHeader><h2 className="font-semibold">Contacto</h2></CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm text-muted-foreground">Teléfono</dt><dd className="break-words font-semibold">{cliente.telefono ?? "Sin registrar"}</dd></div>
            <div><dt className="text-sm text-muted-foreground">Dirección</dt><dd className="break-words font-medium">{cliente.direccion ?? "Sin registrar"}</dd></div>
          </dl>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-semibold">Dispositivos ({equipos.length})</h2>
          <DialogoEquipo clienteId={cliente.id} principal />
        </CardHeader>
        <CardContent>
          {equipos.length > 0 ? <TablaEquipos equipos={equipos} />
            : <p className="text-sm text-muted-foreground">Este cliente todavía no tiene equipos registrados.</p>}
        </CardContent>
      </Card>
    </section>
  );
}
