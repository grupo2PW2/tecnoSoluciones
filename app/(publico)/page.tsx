import { PublicOrderLookup } from "@/components/public-order-lookup";

export default function HomePage() {
  return (
    <main className="min-h-svh bg-muted/30 px-4 py-12">
      <section className="mx-auto grid max-w-lg gap-8">
        <div>
          <p className="text-sm text-muted-foreground">Tecno Soluciones</p>
          <h1 className="mt-2 text-3xl font-semibold">Consulta tu orden</h1>
          <p className="mt-2 text-muted-foreground">
            Usa el código privado que aparece en tu ticket de recepción.
          </p>
        </div>
        <div className="rounded-xl bg-card p-6 text-card-foreground ring-1 ring-foreground/10">
          <PublicOrderLookup />
        </div>
      </section>
    </main>
  );
}
