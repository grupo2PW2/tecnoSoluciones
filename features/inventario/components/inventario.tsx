import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RepuestoInventario } from "../modelo";
import { FormularioRepuesto } from "@/features/repuestos/components/formulario-repuesto";
import { TablaExistencias } from "./tabla-existencias";

export function Inventario({ repuestos }: { repuestos: RepuestoInventario[] }) {
  return (
    <section className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Inventario</h1>
        <div className="flex flex-wrap items-start gap-2">
          <FormularioRepuesto />
          <Link href="/movimientos" className={buttonVariants()}>Ir a Movimientos</Link>
        </div>
      </header>

      <Card id="existencias" className="scroll-mt-6">
        <CardHeader><CardTitle>Existencias</CardTitle></CardHeader>
        <CardContent><TablaExistencias repuestos={repuestos} /></CardContent>
      </Card>
    </section>
  );
}
