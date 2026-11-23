import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MiniaturaImagen } from "@/features/imagenes/components/miniatura-imagen";
import { urlImagen } from "@/features/imagenes/modelo";
import { textoCliente, textoEquipo } from "@/features/ordenes/modelo";
import { tiposDispositivo } from "../modelo";
import type { EquipoFicha } from "../queries";
import { DialogoEquipo } from "./dialogo-equipo";

type EquipoTabla = EquipoFicha & { cliente?: { id: number; nombre: string; apellido: string } | null };

export function TablaEquipos({ equipos, mostrarCliente = false }: { equipos: EquipoTabla[]; mostrarCliente?: boolean }) {
  return <div className="rounded-lg border">
    <Table>
      <TableHeader><TableRow>
        <TableHead>Equipo</TableHead>
        <TableHead>Tipo</TableHead>
        <TableHead>Número de serie</TableHead>
        {mostrarCliente && <TableHead>Cliente</TableHead>}
        <TableHead className="text-right">Acciones</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {equipos.map((equipo) => <TableRow key={equipo.id}>
          <TableCell className="whitespace-normal">
            <div className="flex items-center gap-3">
              <MiniaturaImagen src={urlImagen("dispositivos", equipo.id, equipo.imgUrl)} />
              <span className="font-semibold">{textoEquipo(equipo)}</span>
            </div>
          </TableCell>
          <TableCell>{tiposDispositivo[equipo.tipo]}</TableCell>
          <TableCell className="tabular-nums">{equipo.nroSerie || "Sin registrar"}</TableCell>
          {mostrarCliente && <TableCell className="whitespace-normal">
            <Link href={"/clientes/" + equipo.clienteId} className="font-medium text-primary underline-offset-4 hover:underline">
              {equipo.cliente ? textoCliente(equipo.cliente) : "Ver ficha"}
            </Link>
          </TableCell>}
          <TableCell className="text-right"><DialogoEquipo equipo={equipo} clienteId={equipo.clienteId} /></TableCell>
        </TableRow>)}
      </TableBody>
    </Table>
  </div>;
}
