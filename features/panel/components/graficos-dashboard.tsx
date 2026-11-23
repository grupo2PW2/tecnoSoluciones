"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const actividadConfig = {
  recibidas: { label: "Recibidas", theme: { light: "#0369a1", dark: "#38bdf8" } },
  entregadas: { label: "Entregadas", theme: { light: "#047857", dark: "#34d399" } },
} satisfies ChartConfig;

export function GraficoActividad({ dias }: { dias: { dia: string; recibidas: number; entregadas: number }[] }) {
  if (!dias.some(({ recibidas, entregadas }) => recibidas || entregadas)) {
    return <p className="py-8 text-sm text-muted-foreground">Todavía no hay órdenes recibidas ni entregadas en este periodo.</p>;
  }

  return <>
    <ChartContainer config={actividadConfig} className="h-56 w-full sm:h-64">
      <BarChart accessibilityLayer data={dias} margin={{ left: -6, right: 6 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="dia" tickLine={false} axisLine={false} tickMargin={8} minTickGap={8} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={28} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="recibidas" fill="var(--color-recibidas)" radius={[4, 4, 0, 0]} />
        <Bar dataKey="entregadas" fill="var(--color-entregadas)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
    <ul className="sr-only" aria-label="Datos del gráfico">
      {dias.map(({ dia, recibidas, entregadas }) => <li key={dia}>{dia}. Recibidas {recibidas}. Entregadas {entregadas}.</li>)}
    </ul>
  </>;
}

const resumenConfig = { total: { label: "Órdenes", theme: { light: "#0369a1", dark: "#38bdf8" } } } satisfies ChartConfig;

export function GraficoResumen({ valores, vacio }: { valores: { etiqueta: string; total: number }[]; vacio: string }) {
  if (!valores.some(({ total }) => total > 0)) return <p className="py-8 text-sm text-muted-foreground">{vacio}</p>;
  return <>
    <ChartContainer config={resumenConfig} className="w-full" style={{ height: Math.max(112, valores.length * 46) }}>
      <BarChart accessibilityLayer data={valores} layout="vertical"
        margin={{ right: 30, top: 4, bottom: 3, left: 0 }}>
        <XAxis type="number" hide domain={[0, "dataMax"]} />
        <YAxis dataKey="etiqueta" type="category" tickLine={false} axisLine={false} width={130}
          tickFormatter={(etiqueta: string) => etiqueta === "Pendiente de aprobación" ? "Por aprobar" : etiqueta} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="total" fill="var(--color-total)" radius={4} maxBarSize={22}>
          <LabelList dataKey="total" position="right" offset={8} className="fill-foreground font-semibold" />
        </Bar>
      </BarChart>
    </ChartContainer>
    <ul className="sr-only" aria-label="Datos del gráfico">
      {valores.map(({ etiqueta, total }) => <li key={etiqueta}>{etiqueta}. {total}.</li>)}
    </ul>
  </>;
}
