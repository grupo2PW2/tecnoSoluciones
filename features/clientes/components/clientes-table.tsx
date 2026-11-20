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

import { Button } from "@/components/ui/button";

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
                <TableCell className="font-medium">
                  {cliente.nombre} {cliente.apellido}
                </TableCell>

                <TableCell>{cliente.telefono ?? "Sin teléfono"}</TableCell>

                <TableCell>{cliente.direccion ?? "Sin dirección"}</TableCell>

                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    render={<Link href={`/clientes/${cliente.id}`} />}
                  >
                    Ver detalle
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
