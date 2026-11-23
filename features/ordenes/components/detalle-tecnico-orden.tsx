
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DatosDetalleTecnico } from "../detalle-tecnico";
import { fechaIngreso, tiposIngreso } from "../modelo";
import { EstadoOrdenEtiqueta } from "./estado-orden-etiqueta";
import { DiagnosticoOrden } from "./diagnostico-orden";
import { MotivoCancelacion } from "./cancelacion-orden";

export function DetalleTecnicoOrden({ orden, children }: { orden: DatosDetalleTecnico; children?: ReactNode }) {
  return (
    <section className="mx-auto max-w-5xl space-y-5 px-4 py-6 md:px-8">
      <Button variant="ghost" render={<Link href="/ordenes?vista=mis-ordenes" />} nativeButton={false}>
        <ArrowLeftIcon /> Mis órdenes
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Orden {orden.codigo}</p>
          <h1 className="mt-1 text-2xl font-semibold">{orden.equipo}</h1>
        </div>
        <EstadoOrdenEtiqueta estado={orden.estado} />
      </header>

      <Card>
        <CardHeader><CardTitle>Datos del ingreso</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="font-semibold">Problema reportado</dt>
              <dd className="mt-1 whitespace-pre-wrap break-words">{orden.problemasReportados}</dd>
            </div>
            <div>
              <dt className="font-semibold">Cliente</dt>
              <dd>{orden.cliente}</dd>
            </div>
            <div>
              <dt className="font-semibold">Fecha de ingreso</dt>
              <dd>{fechaIngreso(orden.fechaIngreso)}</dd>
            </div>
            <div>
              <dt className="font-semibold">Tipo de ingreso</dt>
              <dd>{orden.tipoIngreso ? tiposIngreso[orden.tipoIngreso] : "Sin clasificar"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Número de serie</dt>
              <dd>{orden.serie ?? "Sin registrar"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Condición física</dt>
              <dd className="whitespace-pre-wrap break-words">{orden.condicionDispositivo ?? "Sin registrar"}</dd>
            </div>
            <div>
              <dt className="font-semibold">Accesorios recibidos</dt>
              <dd className="whitespace-pre-wrap break-words">{orden.accesoriosRecibidos ?? "Sin registrar"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      {orden.estado === "CANCELADO" && <MotivoCancelacion motivo={orden.motivoCancelacion} />}
      <DiagnosticoOrden orden={{
        id: orden.id,
        tipoIngreso: orden.tipoIngreso,
        estado: orden.estado,
        fechaCierreTecnico: orden.fechaCierreTecnico,
        diagnostico: orden.diagnostico,
        tarifaDiagnostico: orden.tarifaDiagnostico,
      }} />
      {children}
    </section>
  );
}
