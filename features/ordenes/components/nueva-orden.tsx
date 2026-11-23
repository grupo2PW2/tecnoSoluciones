
"use client";

import { useRef, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { PlusIcon } from "lucide-react";
import { notificarGuardado } from "@/components/notificaciones";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { crearCliente } from "@/features/clientes/actions";
import { CamposCliente } from "@/features/clientes/components/form-data";
import { crearDispositivo } from "@/features/dispositivos/actions";
import { CamposEquipo } from "@/features/dispositivos/components/campos-equipo";
import { registrarIngreso } from "../actions";
import { textoCliente, textoEquipo, tiposIngreso, type OpcionIngreso, type TicketIngreso } from "../modelo";
import { ingresoSchema } from "../schemas";
import { DialogoAlta } from "./dialogo-alta";
import { SelectorIngreso } from "./selector-ingreso";
import { SelectorTecnico } from "./selector-tecnico";

export function NuevaOrden({ alGuardar }: { alGuardar: (ticket: TicketIngreso) => void }) {
  const [abierto, setAbierto] = useState(false);
  const disparador = useRef<HTMLButtonElement>(null);
  const [guardando, setGuardando] = useState(false);

  return (
    <Sheet open={abierto} disablePointerDismissal onOpenChange={(valor) => { if (!guardando) setAbierto(valor); }}>
      <SheetTrigger ref={disparador} render={<Button />}><PlusIcon /> Nueva orden</SheetTrigger>
      <SheetContent side="right" showCloseButton={false}
        className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
        finalFocus={disparador}>
        <SheetHeader className="border-b px-6 py-5">
          <SheetTitle className="text-xl">Nueva orden</SheetTitle>
          <SheetDescription>Registra el equipo recibido y genera su ticket de seguimiento.</SheetDescription>
        </SheetHeader>
        {abierto && <FormularioIngreso guardando={guardando} alCambiarGuardado={setGuardando} alCancelar={() => setAbierto(false)} alGuardar={(ticket) => {
          setAbierto(false);
          alGuardar(ticket);
        }} />}
      </SheetContent>
    </Sheet>
  );
}

function FormularioIngreso({ alCancelar, alGuardar, guardando, alCambiarGuardado }: {
  guardando: boolean;
  alCambiarGuardado: (guardando: boolean) => void;
  alCancelar: () => void;
  alGuardar: (ticket: TicketIngreso) => void;
}) {
  const [cliente, setCliente] = useState<OpcionIngreso | null>(null);
  const [equipo, setEquipo] = useState<OpcionIngreso | null>(null);
  const [tecnicoId, setTecnicoId] = useState<number | null>(null);
  const pendiente = useRef(false);
  const [error, setError] = useState("");
  const solicitud = useRef<string | null>(null);
  const queryClient = useQueryClient();

  function seleccionarCliente(opcion: OpcionIngreso | null) {
    if (opcion?.id !== cliente?.id) setEquipo(null);
    setCliente(opcion);
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (pendiente.current) return;
    if (!cliente || !equipo) {
      setError("Selecciona un cliente y uno de sus equipos.");
      return;
    }

    // getRandomValues está disponible también al trabajar en la red local por HTTP.
    solicitud.current ??= generarSolicitud();
    const formulario = new FormData(evento.currentTarget);
    const resultado = ingresoSchema.safeParse({
      solicitud: solicitud.current,
      clienteId: cliente.id,
      dispositivoId: equipo.id,
      tecnicoId,
      tipoIngreso: formulario.get("tipoIngreso"),
      problemasReportados: formulario.get("problemasReportados"),
      condicionDispositivo: formulario.get("condicionDispositivo"),
      accesoriosRecibidos: formulario.get("accesoriosRecibidos"),
    });
    if (!resultado.success) {
      setError(resultado.error.issues[0].message);
      return;
    }

    pendiente.current = true;
    alCambiarGuardado(true);
    setError("");

    try {
      const respuesta = await registrarIngreso(resultado.data);
      if (tecnicoId !== null) void queryClient.invalidateQueries({ queryKey: ["tecnicos-ingreso"] });
      if ("ticket" in respuesta) {
        notificarGuardado("Orden registrada", "Orden " + respuesta.ticket.codigo);
        alGuardar(respuesta.ticket);
      } else setError(respuesta.error ?? "No se pudo confirmar el ingreso.");
    } catch {
      setError("No se pudo confirmar el ingreso. Inténtalo nuevamente.");
    } finally {
      pendiente.current = false;
      alCambiarGuardado(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex min-h-0 flex-1 flex-col" aria-busy={guardando}>
      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-6 py-5">
        <section className="space-y-4" aria-labelledby="datos-cliente-equipo">
          <h2 id="datos-cliente-equipo" className="font-semibold">Cliente y equipo</h2>
          <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <SelectorIngreso id="orden-cliente" etiqueta="Cliente" ejemplo="Nombre, apellido o teléfono"
              seleccion={cliente} alSeleccionar={seleccionarCliente} disabled={guardando} />
            <DialogoAlta titulo="Nuevo cliente" descripcion="El cliente quedará seleccionado en la orden."
              disabled={guardando} alGuardar={(opcion) => {
                seleccionarCliente(opcion);
                notificarGuardado("Cliente registrado");
                void queryClient.invalidateQueries({ queryKey: ["seleccion-ingreso", null] });
                void queryClient.invalidateQueries({ queryKey: ["clientes"] });
              }}
              guardar={async (formulario) => {
                const resultado = await crearCliente(formulario);
                if (!resultado.cliente) return { error: resultado.error ?? "No se pudo guardar el cliente." };

                const registro = resultado.cliente;
                return { opcion: {
                  id: registro.id,
                  etiqueta: [textoCliente(registro), registro.telefono].filter(Boolean).join(" · "),
                } };
              }}>
              <CamposCliente />
            </DialogoAlta>
          </div>

          {cliente ? (
            <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <SelectorIngreso key={cliente.id} id="orden-equipo" etiqueta="Equipo" ejemplo="Marca, modelo o número de serie"
                clienteId={cliente.id} seleccion={equipo} alSeleccionar={setEquipo} disabled={guardando} />
              <DialogoAlta titulo="Nuevo equipo" descripcion={"El equipo se registrará para " + cliente.etiqueta + "."}
                disabled={guardando} alGuardar={(opcion) => {
                  setEquipo(opcion);
                  notificarGuardado("Equipo registrado");
                  void queryClient.invalidateQueries({ queryKey: ["seleccion-ingreso", cliente.id] });
                }}
                guardar={async (formulario) => {
                  const resultado = await crearDispositivo(cliente.id, formulario);
                  if (!resultado.dispositivo) return { error: resultado.error ?? "No se pudo guardar el equipo." };

                  const registro = resultado.dispositivo;
                  return { opcion: {
                    id: registro.id,
                    etiqueta: [textoEquipo(registro), registro.nroSerie].filter(Boolean).join(" · "),
                  } };
                }}>
                <CamposEquipo />
              </DialogoAlta>
            </div>
          ) : <p className="text-sm text-muted-foreground">Selecciona un cliente para buscar o registrar su equipo.</p>}
        </section>

        <fieldset disabled={guardando} className="space-y-4">
          <legend className="mb-4 font-semibold">Datos del ingreso</legend>
          <SelectorTecnico valor={tecnicoId} alSeleccionar={setTecnicoId} opcional disabled={guardando} />
          <div className="grid gap-2">
            <Label htmlFor="orden-tipo">Tipo de ingreso</Label>
            <Select name="tipoIngreso" items={tiposIngreso} required disabled={guardando}>
              <SelectTrigger id="orden-tipo" className="w-full">
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(tiposIngreso).map(([valor, etiqueta]) => (
                  <SelectItem key={valor} value={valor}>{etiqueta}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="orden-motivo">Motivo de ingreso</Label>
            <Textarea id="orden-motivo" name="problemasReportados" rows={3} required maxLength={2000} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="orden-condicion">Condición física (opcional)</Label>
            <Textarea id="orden-condicion" name="condicionDispositivo" rows={2} maxLength={1000} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="orden-accesorios">Accesorios recibidos (opcional)</Label>
            <Textarea id="orden-accesorios" name="accesoriosRecibidos" rows={2} maxLength={1000} />
          </div>
        </fieldset>
      </div>

      <SheetFooter className="shrink-0 border-t px-6 sm:flex-row sm:flex-wrap sm:justify-end">
        {error && <p role="alert" className="w-full text-destructive">{error}</p>}
        <Button type="button" variant="outline" disabled={guardando} onClick={alCancelar}>Cancelar</Button>
        <Button type="submit" disabled={guardando}>{guardando ? "Guardando…" : "Guardar orden"}</Button>
      </SheetFooter>
    </form>
  );
}

function generarSolicitud() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join("-");
}
