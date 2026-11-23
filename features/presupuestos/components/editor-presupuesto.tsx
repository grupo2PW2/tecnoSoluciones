
"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { guardarPresupuesto, registrarServicioParaPresupuesto } from "../actions";
import { DialogoAlta } from "@/features/ordenes/components/dialogo-alta";
import { CamposServicio } from "@/features/servicios/components/campos-servicio";
import { calcularPresupuesto, importePartida, mostrarBs, type PrioridadPresupuesto } from "../importes";
import type { DetallePresupuesto, OpcionRepuesto, OpcionServicio, PartidaPresupuesto } from "../modelo";
import { RepuestosPresupuesto } from "./repuestos-presupuesto";
import { presupuestoSchema } from "../schemas";

const prioridades = { BAJA: "Baja (0 %)", MEDIA: "Media (5 %)", ALTA: "Alta (10 %)" };

interface Props {
  ordenId: number;
  presupuesto: DetallePresupuesto;
  catalogo: OpcionServicio[];
  catalogoRepuestos: OpcionRepuesto[];
  hoy: string;
  servicioDirecto?: boolean;
}

export function EditorPresupuesto(props: Props) {
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [actualizando, actualizar] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-2">
      <Sheet open={abierto} disablePointerDismissal onOpenChange={(valor) => {
        if (!guardando) setAbierto(valor);
      }}>
        <SheetTrigger render={<Button disabled={actualizando} />}>Editar presupuesto</SheetTrigger>
        <SheetContent side="right" showCloseButton={false} className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-3xl">
          <SheetHeader className="border-b px-6 py-5">
            <SheetTitle>{props.servicioDirecto ? "Presupuesto de servicio directo" : "Presupuesto de reparación"}</SheetTitle>
            <SheetDescription>Versión {props.presupuesto.version} · Borrador</SheetDescription>
          </SheetHeader>
          {abierto && <Formulario {...props} guardando={guardando} alCambiarGuardado={setGuardando}
            alCancelar={() => setAbierto(false)}
            alGuardar={(presentado) => {
              setAbierto(false);
              notificarGuardado(presentado
                ? props.servicioDirecto ? "Aceptación registrada en tienda" : "Presupuesto presentado"
                : "Borrador guardado");
              actualizar(() => router.refresh());
            }}
            alActualizarCatalogo={() => actualizar(() => router.refresh())} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Formulario({ ordenId, presupuesto, catalogo, catalogoRepuestos, hoy, servicioDirecto, guardando, alCambiarGuardado,
  alGuardar, alCancelar, alActualizarCatalogo }: Props & {
  guardando: boolean;
  alCambiarGuardado: (valor: boolean) => void;
  alGuardar: (presentado: boolean) => void;
  alCancelar: () => void;
  alActualizarCatalogo: () => void;
}) {
  const [servicios, setServicios] = useState(presupuesto.servicios);
  const [repuestos, setRepuestos] = useState(presupuesto.repuestos);
  const [altas, setAltas] = useState<OpcionServicio[]>([]);
  const [prioridad, setPrioridad] = useState(presupuesto.prioridad);
  const [fechaEstimada, setFechaEstimada] = useState(presupuesto.fechaEstimada && presupuesto.fechaEstimada >= hoy ? presupuesto.fechaEstimada : "");
  const [fechaVencimiento, setFechaVencimiento] = useState(presupuesto.fechaVencimiento ?? "");
  const [observaciones, setObservaciones] = useState(presupuesto.observaciones);
  const [buscar, setBuscar] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState("");
  const pendiente = useRef(false);

  const importes = calcularPresupuesto(servicios, repuestos, presupuesto.diagnostico?.precioUnitario ?? "0.00", prioridad);
  const preciosGuardados = new Map(presupuesto.servicios.map((servicio) => [servicio.id, servicio.precioUnitario]));
  const catalogoCompleto = [...catalogo, ...altas.filter((alta) => !catalogo.some((servicio) => servicio.id === alta.id))];
  const opciones = catalogoCompleto.filter((servicio) => !servicios.some((partida) => partida.id === servicio.id))
    .map((servicio) => ({ ...servicio, precioUnitario: preciosGuardados.get(servicio.id) ?? servicio.precioUnitario }));
  const faltanDatos = !servicios.length || !fechaEstimada || (!servicioDirecto && !fechaVencimiento);
  const existencias = new Map(catalogoRepuestos.map((repuesto) => [repuesto.id, repuesto]));
  const repuestosInvalidos = repuestos.some((partida) => {
    const repuesto = existencias.get(partida.id);
    return !repuesto?.disponible || partida.cantidad < 1 || partida.cantidad > repuesto.stock;
  });
  const motivoBloqueo = repuestosInvalidos ? "presupuesto-repuestos-invalidos"
    : faltanDatos ? "presentacion-presupuesto-pendiente" : undefined;
  const tituloConfirmacion = servicioDirecto ? "Registrar aceptación en tienda" : "Presentar presupuesto";

  async function guardar(presentar: boolean) {
    if (pendiente.current) return;
    setError("");
    const validado = presupuestoSchema.safeParse({
      ordenId, presupuestoId: presupuesto.id, presentar, prioridad,
      aceptadoEnTienda: Boolean(servicioDirecto && presentar),
      fechaEstimada: fechaEstimada || null, fechaVencimiento: servicioDirecto ? null : fechaVencimiento || null,
      observaciones, servicios, repuestos,
    });
    if (!validado.success) {
      setError(validado.error.issues[0].message);
      return;
    }

    pendiente.current = true;
    alCambiarGuardado(true);
    try {
      const respuesta = await guardarPresupuesto(validado.data);
      if ("error" in respuesta) {
        setError(respuesta.error ?? "No se pudo guardar el presupuesto.");
        if ("actualizarCatalogo" in respuesta && respuesta.actualizarCatalogo) alActualizarCatalogo();
        return;
      }

      alGuardar(presentar);
    } catch {
      setError("No se pudo confirmar el guardado. Inténtalo nuevamente.");
    } finally {
      pendiente.current = false;
      alCambiarGuardado(false);
    }
  }

  function guardarBorrador(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    void guardar(false);
  }

  function agregarServicio(servicio: OpcionServicio | null) {
    if (!servicio) return;
    setServicios((actuales) => [...actuales, { ...servicio, cantidad: 1 }]);
    setBuscar("");
  }

  function agregarNuevoServicio(servicio: OpcionServicio) {
    notificarGuardado("Servicio registrado", "Se agregó al borrador del presupuesto.");
    setAltas((actuales) => [...actuales, servicio]);
    agregarServicio(servicio);
    alActualizarCatalogo();
  }

  function cambiarCantidad(id: number, cantidad: number) {
    setServicios((actuales) => actuales.map((servicio) => servicio.id === id ? { ...servicio, cantidad } : servicio));
  }

  return (
    <form onSubmit={guardarBorrador} className="flex min-h-0 flex-1 flex-col" aria-busy={guardando}>
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">Servicios</h3>
            {!servicioDirecto && <DialogoAlta<OpcionServicio> titulo="Nuevo servicio"
              descripcion="Se guardará en el catálogo y se agregará al editor del presupuesto."
              disabled={guardando} alGuardar={agregarNuevoServicio}
              guardar={async (formulario) => {
                const resultado = await registrarServicioParaPresupuesto(ordenId, presupuesto.id, formulario);
                if ("error" in resultado) {
                  alActualizarCatalogo();
                  return { error: resultado.error ?? "No se pudo registrar el servicio." };
                }
                return { opcion: resultado.opcion };
              }}>
              <CamposServicio />
            </DialogoAlta>}
          </div>
          {catalogoCompleto.length === 0 ? (
            <p className="rounded-lg border p-3 text-muted-foreground">{servicioDirecto
              ? "El catálogo no tiene servicios activos para cotizar. Solicita a Administración que registre uno."
              : "Registra un servicio de mano de obra para agregarlo al presupuesto."}</p>
          ) : <div className="grid gap-2">
            <Label htmlFor="agregar-servicio-presupuesto">Agregar servicio</Label>
            <Combobox<OpcionServicio> items={opciones} value={null} inputValue={buscar}
              itemToStringLabel={(servicio) => servicio.nombre}
              onInputValueChange={setBuscar} onValueChange={agregarServicio} disabled={guardando}>
              <ComboboxInput id="agregar-servicio-presupuesto" placeholder="Buscar por nombre" disabled={guardando} />
              <ComboboxContent>
                <ComboboxEmpty>No hay servicios para agregar.</ComboboxEmpty>
                <ComboboxList>
                  {(servicio: OpcionServicio) => <ComboboxItem key={servicio.id} value={servicio}>
                    <span className="min-w-0 flex-1 break-words">{servicio.nombre}</span>
                    <span className="shrink-0 text-muted-foreground">{mostrarBs(servicio.precioUnitario)}</span>
                  </ComboboxItem>}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>}

          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead className="text-right">Precio unitario</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead><span className="sr-only">Quitar partida</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presupuesto.diagnostico && <PartidaDiagnostico partida={presupuesto.diagnostico} />}
                {servicios.map((servicio) => (
                  <TableRow key={servicio.id}>
                    <TableCell className="max-w-52 whitespace-normal break-words font-medium">{servicio.nombre}</TableCell>
                    <TableCell>
                      <Input type="text" inputMode="numeric" className="w-16" aria-label={"Cantidad de " + servicio.nombre}
                        value={servicio.cantidad || ""} maxLength={4} disabled={guardando}
                        onChange={(evento) => {
                          const valor = evento.target.value;
                          if (/^\d{0,4}$/.test(valor)) cambiarCantidad(servicio.id, Number(valor));
                        }} />
                    </TableCell>
                    <TableCell className="text-right">{mostrarBs(servicio.precioUnitario)}</TableCell>
                    <TableCell className="text-right">{mostrarBs(importePartida(servicio))}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="ghost" size="sm" disabled={guardando} aria-label={"Quitar " + servicio.nombre}
                        onClick={() => setServicios((actuales) => actuales.filter((partida) => partida.id !== servicio.id))}>
                        Quitar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <RepuestosPresupuesto partidas={repuestos} catalogo={catalogoRepuestos} preciosGuardados={presupuesto.repuestos}
          disabled={guardando} alCambiar={setRepuestos} />

        <fieldset disabled={guardando} className="space-y-4">
          <legend className="mb-3 font-semibold">Condiciones de la oferta</legend>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="prioridad-presupuesto">Prioridad</Label>
              <Select items={prioridades} value={prioridad} onValueChange={(valor: PrioridadPresupuesto | null) => {
                if (valor) setPrioridad(valor);
              }} disabled={guardando}>
                <SelectTrigger id="prioridad-presupuesto" className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(prioridades).map(([valor, etiqueta]) => <SelectItem key={valor} value={valor}>{etiqueta}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="entrega-presupuesto">Entrega estimada</Label>
              <Input id="entrega-presupuesto" type="date" min={hoy} value={fechaEstimada}
                onChange={(evento) => setFechaEstimada(evento.target.value)} />
            </div>
            {!servicioDirecto && <div className="grid gap-2">
              <Label htmlFor="vence-presupuesto">Válido hasta</Label>
              <Input id="vence-presupuesto" type="date" min={hoy} value={fechaVencimiento}
                onChange={(evento) => setFechaVencimiento(evento.target.value)} />
            </div>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notas-presupuesto">Notas para el cliente (opcional)</Label>
            <Textarea id="notas-presupuesto" rows={2} maxLength={2000} value={observaciones}
              onChange={(evento) => setObservaciones(evento.target.value)} />
          </div>
        </fieldset>

        <dl className="ml-auto grid max-w-sm gap-2 rounded-lg border bg-muted/30 p-4">
          <div className="flex justify-between gap-3"><dt>Subtotal de servicios</dt><dd>{mostrarBs(importes.subtotalServicios)}</dd></div>
          <div className="flex justify-between gap-3"><dt>Subtotal de repuestos</dt><dd>{mostrarBs(importes.subtotalRepuestos)}</dd></div>
          <div className="flex justify-between gap-3"><dt>Recargo ({importes.porcentajeRecargo} %)</dt><dd>{mostrarBs(importes.montoRecargo)}</dd></div>
          {presupuesto.diagnostico && <div className="flex justify-between gap-3"><dt>Descuento si aprueba</dt><dd>−{mostrarBs(importes.descuentoDiagnostico)}</dd></div>}
          <div className="flex justify-between gap-3 border-t pt-2 font-semibold"><dt>Total de la oferta</dt><dd>{mostrarBs(importes.total)}</dd></div>
        </dl>
      </div>

      <SheetFooter className="shrink-0 border-t px-6 sm:flex-row sm:flex-wrap sm:justify-end">
        {faltanDatos && <p id="presentacion-presupuesto-pendiente" className="w-full text-muted-foreground">
          {servicioDirecto ? "Agrega un servicio e indica la fecha estimada de entrega." : "Agrega un servicio e indica ambas fechas para presentar."}
        </p>}
        {repuestosInvalidos && <p id="presupuesto-repuestos-invalidos" className="w-full text-destructive">
          Revisa la cantidad de los repuestos marcados o quita las partidas sin existencias.
        </p>}
        {error && !confirmar && <p role="alert" className="w-full text-destructive">{error}</p>}
        <Button type="button" variant="outline" disabled={guardando} onClick={alCancelar}>Cancelar</Button>
        <Button type="submit" variant="outline" disabled={guardando || repuestosInvalidos} aria-describedby={repuestosInvalidos ? motivoBloqueo : undefined}>Guardar borrador</Button>
        <Dialog open={confirmar} onOpenChange={(abierto) => {
          if (!pendiente.current) {
            if (abierto) setError("");
            setConfirmar(abierto);
          }
        }}>
          <DialogTrigger render={<Button type="button" disabled={guardando || faltanDatos || repuestosInvalidos}
            aria-describedby={motivoBloqueo} />}>
            {tituloConfirmacion}
          </DialogTrigger>
          <DialogContent showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>{tituloConfirmacion}</DialogTitle>
              <DialogDescription>{servicioDirecto
                ? `Confirma que el cliente aceptó verbalmente el total de ${mostrarBs(importes.total)}. Se autorizará el trabajo sin registrar un cobro.`
                : `El cliente podrá consultar la versión ${presupuesto.version} por ${mostrarBs(importes.total)}.`}</DialogDescription>
            </DialogHeader>
            {error && <p role="alert" className="text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" disabled={guardando} onClick={() => setConfirmar(false)}>Volver</Button>
              <Button type="button" disabled={guardando || repuestosInvalidos} onClick={() => void guardar(true)}>
                {guardando ? "Registrando…" : servicioDirecto ? "Confirmar aceptación verbal" : "Confirmar presentación"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetFooter>
    </form>
  );
}

function PartidaDiagnostico({ partida }: { partida: PartidaPresupuesto }) {
  return (
    <TableRow className="bg-muted/30">
      <TableCell className="font-medium">{partida.nombre}</TableCell>
      <TableCell>{partida.cantidad}</TableCell>
      <TableCell className="text-right">{mostrarBs(partida.precioUnitario)}</TableCell>
      <TableCell className="text-right">{mostrarBs(importePartida(partida))}</TableCell>
      <TableCell className="text-xs text-muted-foreground">Finalizado</TableCell>
    </TableRow>
  );
}
