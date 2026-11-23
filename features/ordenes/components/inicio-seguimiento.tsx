import Image from "next/image";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, ClipboardListIcon, LogInIcon, QrCodeIcon, TicketIcon, WrenchIcon } from "lucide-react";
import { FormularioSeguimiento } from "./formulario-seguimiento";
import "./inicio-seguimiento.css";

const guia = [
  {
    titulo: "Busca tu ticket",
    texto: "En tu comprobante de ingreso encontrarás el campo «Código de consulta».",
    Icono: TicketIcon,
  },
  {
    titulo: "Escanea el QR",
    texto: "Si tu ticket tiene un QR, ábrelo con la cámara del celular para ir directo a tu orden.",
    Icono: QrCodeIcon,
  },
  {
    titulo: "Revisa el avance",
    texto: "Consulta el estado del equipo y responde a un presupuesto cuando esté disponible.",
    Icono: ClipboardListIcon,
  },
];

export function InicioSeguimiento() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-slate-200/80 dark:border-slate-800">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-3 px-5 sm:px-8 lg:px-12">
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-lg font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring sm:text-lg">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-blue-700 text-white">
              <WrenchIcon className="size-4" aria-hidden="true" />
            </span>
            Tecno Soluciones
          </Link>
          <Link href="/login" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-1 text-sm font-semibold text-slate-600 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-ring dark:text-slate-300 dark:hover:text-blue-300">
            <LogInIcon className="size-4" aria-hidden="true" />
            Acceso del personal
          </Link>
        </div>
      </header>

      <section aria-labelledby="titulo-seguimiento" className="bg-linear-to-b from-blue-50/70 to-background dark:from-blue-950/25">
        <div className="mx-auto grid max-w-7xl items-center gap-9 px-5 pt-10 pb-12 sm:px-8 sm:py-16 lg:grid-cols-[1fr_0.96fr] lg:gap-14 lg:px-12 lg:py-20">
          <div className="min-w-0">
            <h1 id="titulo-seguimiento" className="text-[clamp(2.65rem,5.2vw,4.85rem)] leading-[0.99] font-bold tracking-[-0.045em] text-balance">
              Consulta el estado <span className="block text-blue-700 dark:text-blue-300">de tu equipo.</span>
            </h1>
            <p className="mt-4 max-w-sm text-base text-pretty text-muted-foreground sm:mt-6 sm:text-lg">
              Usa el código de tu ticket para saber en qué etapa está tu orden.
            </p>
            <div className="mt-6 max-w-md rounded-2xl border border-blue-100 bg-card p-4 shadow-lg shadow-blue-950/5 sm:mt-8 sm:p-6 dark:border-blue-900/70">
              <FormularioSeguimiento />
            </div>
            <a href="#guia-seguimiento" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-md text-sm font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring dark:text-blue-300">
              <ArrowDownIcon className="size-4" aria-hidden="true" />
              ¿Cómo consulto mi orden?
            </a>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1.65rem] bg-slate-950 shadow-xl shadow-slate-950/14 ring-1 ring-slate-950/10 sm:rounded-[2.25rem] lg:aspect-[1.04]">
            <Image src="/taller-reparacion.webp" alt="" fill sizes="(min-width: 1280px) 560px, (min-width: 1024px) 46vw, 100vw"
              className="object-cover object-[50%_63%]" loading="eager" />
            <div aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-white/15 ring-inset" />
          </div>
        </div>
      </section>

      <section id="guia-seguimiento" aria-labelledby="titulo-guia" className="scroll-mt-5 border-y border-slate-200/80 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/45">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
          <h2 id="titulo-guia" className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">Cómo seguir tu orden</h2>
          <ul className="mt-7 grid gap-3 sm:grid-cols-3 sm:gap-5">
            {guia.map(({ titulo, texto, Icono }) => (
              <li key={titulo} className="inicio-seguimiento-aparecer rounded-2xl border border-slate-200/80 bg-card p-5 sm:p-6 dark:border-slate-800">
                <span className="mb-4 grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/75 dark:text-blue-300">
                  <Icono className="size-5" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-bold">{titulo}</h3>
                <p className="mt-1 text-pretty text-muted-foreground">{texto}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-5 gap-y-1 px-5 py-4 text-sm sm:px-8 lg:px-12">
        <span className="font-semibold text-muted-foreground">Tecno Soluciones</span>
        <a href="#codigo-consulta" className="inline-flex min-h-11 items-center gap-2 rounded-md font-semibold text-blue-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring dark:text-blue-300">
          Volver a la consulta <ArrowUpIcon className="size-4" aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
