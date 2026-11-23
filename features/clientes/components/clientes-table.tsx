import Link from "next/link";

import type { ClienteListado } from "../types";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { buttonVariants } from "@/components/ui/button";

interface Props {
  clientes: ClienteListado[];
}

export function ClientesTable({ clientes }: Props) {
  return (
    <div className="overflow-hidden rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Cliente</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Dirección</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {clientes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No hay clientes registrados.
              </TableCell>
            </TableRow>
          ) : (
            clientes.map((cliente) => (
              <TableRow key={cliente.id}>
                <TableCell className="whitespace-normal font-semibold">
                  {cliente.nombre} {cliente.apellido}
                </TableCell>

                <TableCell>{cliente.telefono ?? "Sin teléfono"}</TableCell>

                <TableCell>{cliente.direccion ?? "Sin dirección"}</TableCell>

                <TableCell className="text-right">
                  <Link href={`/clientes/${cliente.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    Ver ficha
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
