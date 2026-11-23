
"use client";

import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { ExternalLinkIcon, PrinterIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fechaIngreso, type TicketIngreso } from "../modelo";
import "./ticket.css";

function ContenidoTicket({ ticket }: { ticket: TicketIngreso }) {
  const portada = new URL("/", ticket.origenPublico ?? window.location.origin).href;
  const seguimiento = new URL("/orden/" + encodeURIComponent(ticket.codigoCliente), portada).href;

  return (
    <article className="ticket-ingreso-papel space-y-5 rounded-lg border p-5">
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b pb-3">
        <div>
          <p className="text-xl font-bold">Tecno Soluciones</p>
          <p className="font-medium">Ticket de ingreso</p>
        </div>
        <p className="text-sm font-semibold tabular-nums">Orden {ticket.codigo}</p>
      </header>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div><dt className="font-semibold">Equipo</dt><dd className="wrap-break-word">{ticket.equipo}</dd></div>
        <div><dt className="font-semibold">Fecha de ingreso</dt><dd>{fechaIngreso(ticket.fechaIngreso)}</dd></div>
      </dl>
      <section aria-label="Consulta de la orden"
        className="grid items-center gap-4 rounded-md border bg-muted/50 p-4 sm:grid-cols-[minmax(0,1fr)_auto] print:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 space-y-2">
          <div>
            <p className="text-sm font-semibold">Código de consulta</p>
            <p className="mt-1 break-all font-mono text-base font-bold select-all">{ticket.codigoCliente}</p>
          </div>
          <p className="text-sm">Escanea el QR o ingresa el código en la página de seguimiento.</p>
          <a className="block break-all text-sm font-semibold underline underline-offset-2"
            href={portada} target="_blank" rel="noreferrer">{portada}</a>
          <a className="flex w-fit items-center gap-1.5 text-sm underline underline-offset-2 print:hidden"
            href={seguimiento} target="_blank" rel="noreferrer">Abrir seguimiento <ExternalLinkIcon className="size-3.5" aria-hidden="true" /></a>
        </div>
        <QRCodeSVG value={seguimiento} size={128} marginSize={4} level="M" role="img"
          title="Código QR para abrir el seguimiento" className="justify-self-center" />
      </section>
    </article>
  );
}

export function VistaTicket({ ticket, alCerrar, origenFoco }: {
  ticket: TicketIngreso | null;
  alCerrar: () => void;
  origenFoco: RefObject<HTMLElement | null>;
}) {
  return (
    <>
      <Dialog open={ticket !== null} onOpenChange={(abierto) => { if (!abierto) alCerrar(); }}>
        <DialogContent showCloseButton={false} className="max-h-[90dvh] overflow-y-auto sm:max-w-lg"
          finalFocus={() => origenFoco.current ?? true}>
          <DialogHeader>
            <DialogTitle>Ticket de ingreso</DialogTitle>
            <DialogDescription>Revisa el ticket antes de imprimirlo.</DialogDescription>
          </DialogHeader>
          {ticket && <ContenidoTicket ticket={ticket} />}
          <DialogFooter>
            <Button variant="outline" onClick={alCerrar}>Cerrar</Button>
            <Button onClick={() => window.print()}><PrinterIcon /> Imprimir ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {ticket && createPortal(
        <div className="ticket-para-imprimir" aria-hidden="true"><ContenidoTicket ticket={ticket} /></div>,
        document.body,
      )}
    </>
  );
}
