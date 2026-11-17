#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/696e58316d4f3cc1dfbc4112f8cf7f071eebd734cd427c87a263631bcd42697d/contract';
import endContract from '../../snapshots/696e58316d4f3cc1dfbc4112f8cf7f071eebd734cd427c87a263631bcd42697d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/76a9d7dabfe8a6e50c6aedebbbfbbca570e2b0cab6c402e23dcec2aa877f6c9b/contract';
import startContract from '../../snapshots/76a9d7dabfe8a6e50c6aedebbbfbbca570e2b0cab6c402e23dcec2aa877f6c9b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Usuarios',
        constraint: 'Usuarios_rol_check_e20a97be',
      }),
      this.addRequiredColumnToEmptyTable({
        schema: 'public',
        table: 'Orden',
        column: 'codigoCliente',
        type: 'text',
      }),
      this.removeStoredValue({
        schema: 'public',
        table: 'Usuarios',
        column: 'rol',
        value: 'ALMACENISTA',
        codecRef: { codecId: 'pg/text@1' },
        enumValue: { namespaceId: 'public', enum: 'Rol', member: 'ALMACENISTA' },
      }),
      this.addUnique({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_codigoCliente_key',
        columns: ['codigoCliente'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Usuarios',
        constraint: 'Usuarios_rol_check_354854ec',
        expression: sql`"rol" IN ('ADMINISTRADOR', 'TECNICO', 'RECEPCIONISTA', 'GERENTE')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
