
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OrdenNoDisponible() {
  return (
    <section className="mx-auto max-w-5xl space-y-4 px-4 py-6 md:px-8">
      <h1 className="text-2xl font-semibold">Orden no disponible</h1>
      <p className="text-muted-foreground">Vuelve a la bandeja para consultar las órdenes disponibles para tu usuario.</p>
      <Button variant="outline" render={<Link href="/ordenes?vista=mis-ordenes" />} nativeButton={false}>
        Volver a la bandeja
      </Button>
    </section>
  );
}
