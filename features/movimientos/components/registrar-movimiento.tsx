"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { ArrowDownToLineIcon, ArrowUpFromLineIcon, ShoppingCartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { notificarGuardado, notificarInformacion } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import {
  Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList,
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { mostrarBs } from "@/features/presupuestos/importes";
import { mostrarCajasYUnidades, mostrarUnidades } from "@/lib/existencias";
import { guardarEntrada, guardarSalida, guardarVenta } from "../actions";
import { calcularUnidadesMovimiento, maxUnidadesInventario, type RepuestoInventario } from "@/features/inventario/modelo";
import type { TipoMovimientoRegistrable } from "../modelo";
import { calcularPreciosEntrada, calcularTotalVenta, formatoCostoTotal, gananciaValida, mostrarImporteExacto } from "@/features/inventario/precios";
import { entradaSchema, salidaSchema, ventaSchema } from "../schemas";

interface LineaMovimiento {
  repuesto: RepuestoInventario;
  cajas: string;
  unidades: string;
  costoTotal: string;
}

const etiquetas = {
  ENTRADA: { nombre: "entrada", titulo: "Registrar entrada", guardar: "Guardar entrada",
    descripcion: "Agrega los repuestos del lote. Las cajas y las unidades sueltas se sumarán al stock de cada uno.",
    ayuda: "Da de alta un repuesto para registrar una entrada." },
  SALIDA: { nombre: "salida", titulo: "Registrar salida", guardar: "Guardar salida",
    descripcion: "Agrega los repuestos que se retirarán del stock e indica el motivo de la salida.",
    ayuda: "Se necesita stock disponible para registrar una salida." },
  SALIDA_VENTA: { nombre: "venta", titulo: "Nueva venta", guardar: "Confirmar cobro y entrega",
    descripcion: "Agrega los repuestos y revisa el total. Confirma al cobrar y entregar los productos.",
    ayuda: "Se necesita un repuesto disponible con stock y precio de venta para registrar una venta." },
};

function sePuedeAgregar(repuesto: RepuestoInventario, tipo: TipoMovimientoRegistrable) {
  if (tipo === "ENTRADA") return repuesto.estado !== "DESCATALOGADO";
  if (tipo === "SALIDA") return repuesto.stock > 0;
  return repuesto.stock > 0 && repuesto.estado === "DISPONIBLE" && Number(repuesto.precioVenta) > 0;
}

export function RegistrarMovimiento({ catalogo, margenGanancia, tipo }: {
  catalogo: RepuestoInventario[]; margenGanancia: string; tipo: TipoMovimientoRegistrable;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [actualizando, actualizar] = useTransition();
  const esEntrada = tipo === "ENTRADA";
  const { nombre: nombreMovimiento } = etiquetas[tipo];
  const etiquetaMovimiento = nombreMovimiento[0].toUpperCase() + nombreMovimiento.slice(1);
  const { titulo, descripcion, ayuda } = etiquetas[tipo];
  const Icono = esEntrada ? ArrowDownToLineIcon : tipo === "SALIDA" ? ArrowUpFromLineIcon : ShoppingCartIcon;
  const sinProductos = !catalogo.some((repuesto) => sePuedeAgregar(repuesto, tipo));

  return (
    <div className="space-y-2">
      <Sheet open={abierto} disablePointerDismissal onOpenChange={(valor) => {
        if (!guardando) setAbierto(valor);
      }}>
        <SheetTrigger render={<Button variant={tipo === "SALIDA_VENTA" || esEntrada ? "default" : "outline"} disabled={sinProductos || actualizando}
          aria-describedby={sinProductos ? nombreMovimiento + "-sin-productos" : undefined} />}><Icono aria-hidden="true" />{titulo}</SheetTrigger>
        <SheetContent side="right" showCloseButton={false} className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>{titulo}</SheetTitle>
            <SheetDescription>
              {descripcion}
            </SheetDescription>
          </SheetHeader>
          {abierto && <Formulario catalogo={catalogo} margenGanancia={margenGanancia} tipo={tipo} guardando={guardando} alCambiarGuardado={setGuardando}
            alCancelar={() => setAbierto(false)}
            alActualizar={() => actualizar(() => router.refresh())}
            alGuardar={(id, repetida) => {
              setAbierto(false);
              const movimiento = `${etiquetaMovimiento} #${id}`;
              if (repetida) {
                notificarInformacion(`${movimiento} ya registrada. Consulta el historial.`);
              } else {
                notificarGuardado(`${movimiento} registrada.`);
              }
              actualizar(() => router.refresh());
            }} />}
        </SheetContent>
      </Sheet>
      {sinProductos && <p id={nombreMovimiento + "-sin-productos"} className="text-sm text-muted-foreground">
        {ayuda}
      </p>}
    </div>
  );
}

function Formulario({ catalogo, margenGanancia, tipo, guardando, alCambiarGuardado, alGuardar, alCancelar, alActualizar }: {
  catalogo: RepuestoInventario[];
  margenGanancia: string;
  tipo: TipoMovimientoRegistrable;
  alActualizar: () => void;
  guardando: boolean;
  alCambiarGuardado: (valor: boolean) => void;
  alGuardar: (id: number, repetida: boolean) => void;
  alCancelar: () => void;
}) {
  const [lineas, setLineas] = useState<LineaMovimiento[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [referencia, setReferencia] = useState("");
  const [error, setError] = useState("");
  const pendiente = useRef(false);
  const solicitudId = useRef<string | null>(null);

  const esEntrada = tipo === "ENTRADA";
  const esVenta = tipo === "SALIDA_VENTA";
  const { nombre: nombreMovimiento, guardar: etiquetaGuardar } = etiquetas[tipo];
  const seleccionados = new Set(lineas.map(({ repuesto }) => repuesto.id));
  const opciones = catalogo.filter((repuesto) => !seleccionados.has(repuesto.id) && sePuedeAgregar(repuesto, tipo));
  const catalogoActual = new Map(catalogo.map((repuesto) => [repuesto.id, repuesto]));
  const margenValido = gananciaValida(margenGanancia);
  const partidas = lineas.map((linea) => {
    const total = calcularUnidadesMovimiento(Number(linea.cajas), Number(linea.unidades), linea.repuesto.unidadesCaja);
    const actual = catalogoActual.get(linea.repuesto.id);
    const stock = actual?.stock ?? 0;
    const precioUnitario = actual?.precioVenta ?? "0.00";
    const precioNoDisponible = esVenta && (actual?.estado !== "DISPONIBLE" || Number(precioUnitario) <= 0);
    const desborda = esEntrada && total !== null && stock + total > maxUnidadesInventario;
    const excedeStock = !esEntrada && total !== null && total > stock;
    const costoValido = formatoCostoTotal.test(linea.costoTotal.trim());
    const precios = esEntrada && total && !desborda && costoValido && margenValido ? calcularPreciosEntrada({
      cantidad: total, costoTotal: linea.costoTotal, stockAnterior: stock,
      costoAnterior: linea.repuesto.costoActual, margenGanancia,
    }) : null;
    return { ...linea, total, desborda, excedeStock, stock, precios, costoValido, precioUnitario, precioNoDisponible };
  });
  const incompleto = !partidas.length || (esEntrada ? partidas.some(({ precios }) => precios === null)
    : (tipo === "SALIDA" && !referencia.trim()) || partidas.some(({ total, excedeStock, precioNoDisponible }) =>
      !total || excedeStock || precioNoDisponible));
  const totalVenta = esVenta ? calcularTotalVenta(partidas.map(({ total, precioUnitario }) =>
    ({ cantidad: total ?? 0, precioUnitario }))) : null;

  function agregar(repuesto: RepuestoInventario | null) {
    if (!repuesto || seleccionados.has(repuesto.id)) return;
    setLineas((actuales) => [...actuales, { repuesto, cajas: "0", unidades: "0", costoTotal: "" }]);
    setBusqueda("");
    setError("");
  }

  function actualizarLinea(id: number, campos: Partial<Pick<LineaMovimiento, "cajas" | "unidades" | "costoTotal">>) {
    setLineas((actuales) => actuales.map((linea) => linea.repuesto.id === id ? { ...linea, ...campos } : linea));
    setError("");
  }

  async function guardar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current || incompleto) return;
    solicitudId.current ??= crypto.randomUUID();
    const datos = {
      solicitudId: solicitudId.current,
      referencia,
      partidas: partidas.map((linea) => ({
        repuestoId: linea.repuesto.id,
        cajas: Number(linea.cajas),
        unidadesCaja: Math.max(0, linea.repuesto.unidadesCaja),
        unidades: Number(linea.unidades),
        costoTotal: linea.costoTotal,
        precioUnitario: linea.precioUnitario,
      })),
    };
    const resultado = (esEntrada ? entradaSchema : esVenta ? ventaSchema : salidaSchema).safeParse(datos);
    if (!resultado.success) {
      setError(resultado.error.issues[0].message);
      return;
    }

    pendiente.current = true;
    alCambiarGuardado(true);
    setError("");
    try {
      const respuesta = esEntrada ? await guardarEntrada(datos) : esVenta ? await guardarVenta(datos) : await guardarSalida(datos);
      if ("error" in respuesta) {
        setError(respuesta.error ?? "No se pudo registrar la " + nombreMovimiento + ".");
        alActualizar();
      } else {
        alGuardar(respuesta.id, respuesta.repetida);
      }
    } catch {
      setError("No se pudo confirmar la " + nombreMovimiento + ". Reintenta desde este formulario.");
    } finally {
      pendiente.current = false;
      alCambiarGuardado(false);
    }
  }

  return (
    <form onSubmit={guardar} className="flex min-h-0 flex-1 flex-col" aria-busy={guardando}>
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {esEntrada && (margenValido ? <p className="text-sm text-muted-foreground">
          Ganancia sobre el costo · {Number(margenGanancia).toLocaleString("es-BO")} %
        </p> : <p role="alert" className="text-sm text-destructive">El porcentaje de Configuración debe ser cero o mayor.</p>)}
        <div className="grid gap-2">
          <Label htmlFor={nombreMovimiento + "-repuesto"}>Agregar repuesto</Label>
          <Combobox<RepuestoInventario> items={opciones} value={null} inputValue={busqueda}
            itemToStringLabel={(repuesto) => repuesto.nombre + " " + repuesto.sku}
            onInputValueChange={setBusqueda} onValueChange={agregar} disabled={guardando || lineas.length >= 100}>
            <ComboboxInput id={nombreMovimiento + "-repuesto"} placeholder="Buscar por nombre o código" />
            <ComboboxContent>
              <ComboboxEmpty>No hay repuestos para esta búsqueda.</ComboboxEmpty>
              <ComboboxList>
                {(repuesto: RepuestoInventario) => <ComboboxItem key={repuesto.id} value={repuesto}>
                  <span className="min-w-0 flex-1 break-words">{repuesto.nombre} · {repuesto.sku}</span>
                </ComboboxItem>}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {lineas.length >= 100 && <p className="text-sm text-muted-foreground">Esta {nombreMovimiento} admite hasta 100 líneas.</p>}
        </div>

        <div className="grid gap-3">
          {partidas.map(({ repuesto, cajas, unidades, costoTotal, total, desborda, excedeStock, stock, precios, costoValido, precioUnitario, precioNoDisponible }) => (
            <fieldset key={repuesto.id} disabled={guardando} className="space-y-3 rounded-lg border p-4">
              <legend className="px-1 text-sm font-semibold">{repuesto.nombre} · {repuesto.sku}</legend>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  Stock actual: {mostrarCajasYUnidades({ stock, unidadesCaja: repuesto.unidadesCaja })}
                  {repuesto.unidadesCaja > 0 && " · " + mostrarUnidades(repuesto.unidadesCaja) + " por caja"}
                </p>
                <Button type="button" variant="ghost" size="sm" aria-label={"Quitar " + repuesto.nombre}
                  onClick={() => {
                    setLineas((actuales) => actuales.filter((linea) => linea.repuesto.id !== repuesto.id));
                    setError("");
                  }}>Quitar</Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {repuesto.unidadesCaja > 0 && <Cantidad
                  id={nombreMovimiento + "-cajas-" + repuesto.id} etiqueta="Cajas" repuesto={repuesto.nombre} valor={cajas}
                  alCambiar={(valor) => actualizarLinea(repuesto.id, { cajas: valor })} />}
                <Cantidad id={nombreMovimiento + "-unidades-" + repuesto.id} etiqueta={repuesto.unidadesCaja > 0 ? "Unidades sueltas" : "Unidades"}
                  repuesto={repuesto.nombre} valor={unidades} alCambiar={(valor) => actualizarLinea(repuesto.id, { unidades: valor })} />
                {esEntrada && <div className="grid gap-1">
                  <Label htmlFor={"entrada-costo-" + repuesto.id}>Costo total del lote (Bs)</Label>
                  <Input id={"entrada-costo-" + repuesto.id} aria-label={"Costo total de " + repuesto.nombre}
                    inputMode="decimal" value={costoTotal} maxLength={21} required
                    aria-invalid={Boolean(costoTotal) && !costoValido}
                    onChange={(evento) => actualizarLinea(repuesto.id, { costoTotal: evento.target.value })} />
                </div>}
              </div>
              {total === null || desborda ? <p className="text-sm text-destructive">La cantidad supera el máximo permitido.</p>
                : <p className="text-sm font-medium">Total de la línea: {mostrarUnidades(total)}</p>}
              {excedeStock && <p className="text-sm text-destructive">La cantidad supera el stock de {repuesto.nombre}.</p>}
              {precioNoDisponible && <p className="text-sm text-destructive">Quita este repuesto. Su precio de venta o estado cambió.</p>}
              {esVenta && !precioNoDisponible && <dl className="flex flex-wrap gap-4 text-sm">
                <div><dt>Precio unitario</dt><dd className="font-medium">{mostrarBs(precioUnitario)}</dd></div>
                <div><dt>Subtotal</dt><dd className="font-medium">{mostrarImporteExacto(calcularTotalVenta([
                  { cantidad: total ?? 0, precioUnitario },
                ]) ?? "0.00")}</dd></div>
              </dl>}
              {esEntrada && costoTotal && !costoValido && <p className="text-sm text-destructive">Escribe un costo con hasta dos decimales.</p>}
              {esEntrada && Boolean(total) && !desborda && costoValido && margenValido && !precios &&
                <p className="text-sm text-destructive">Revisa el costo o el precio resultante de este repuesto.</p>}
              {precios && <dl className="grid gap-2 rounded-lg bg-muted/40 p-3 text-sm sm:grid-cols-3">
                <div><dt>Costo unitario del lote</dt><dd className="font-medium">{mostrarBs(precios.costoUnitario)}</dd></div>
                <div><dt>Costo de referencia estimado</dt><dd className="font-medium">{mostrarBs(precios.costoActual)}</dd></div>
                <div><dt>Precio de venta estimado</dt><dd className="font-medium">{mostrarBs(precios.precioVenta)}</dd></div>
              </dl>}
            </fieldset>
          ))}
        </div>

        <div className="grid gap-2">
          <Label htmlFor={nombreMovimiento + "-referencia"}>{tipo === "SALIDA" ? "Motivo de la salida" : "Referencia u observación (opcional)"}</Label>
          <Textarea id={nombreMovimiento + "-referencia"} value={referencia} maxLength={500} rows={2} disabled={guardando} required={tipo === "SALIDA"}
            onChange={(evento) => setReferencia(evento.target.value)} />
        </div>
      </div>

      <SheetFooter className="shrink-0 border-t px-6 sm:flex-row sm:flex-wrap sm:justify-end">
        {totalVenta !== null && <div className="flex w-full justify-between gap-4 font-semibold">
          <span>Total a cobrar</span><span>{mostrarImporteExacto(totalVenta)}</span>
        </div>}
        {incompleto && <p id={nombreMovimiento + "-datos-pendientes"} className="w-full text-sm text-muted-foreground">
          {esEntrada ? "Agrega un repuesto e indica la cantidad y el costo del lote en cada línea."
            : esVenta ? "Agrega repuestos disponibles e indica las cantidades que entregarás."
            : "Indica un motivo y cantidades mayores a cero que estén disponibles en stock."}
        </p>}
        {error && <p role="alert" className="w-full text-sm text-destructive">{error}</p>}
        <Button type="button" variant="outline" disabled={guardando} onClick={alCancelar}>Cancelar</Button>
        <Button type="submit" disabled={guardando || incompleto} aria-describedby={incompleto ? nombreMovimiento + "-datos-pendientes" : undefined}>
          {guardando ? "Registrando…" : etiquetaGuardar}
        </Button>
      </SheetFooter>
    </form>
  );
}

function Cantidad({ id, etiqueta, repuesto, valor, alCambiar }: {
  id: string; etiqueta: string; repuesto: string; valor: string; alCambiar: (valor: string) => void;
}) {
  return (
    <div className="grid gap-1">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Input id={id} inputMode="numeric" aria-label={etiqueta + " de " + repuesto} value={valor} maxLength={10}
        onChange={(evento) => {
          if (/^\d{0,10}$/.test(evento.target.value)) alCambiar(evento.target.value);
        }} />
    </div>
  );
}
