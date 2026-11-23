#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/0d13bb275ba30309d7873f1cbced485e45aec35174cb0eec6db841254416f966/contract';
import endContract from '../../snapshots/0d13bb275ba30309d7873f1cbced485e45aec35174cb0eec6db841254416f966/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/dccb322febcc11c39d7482b29b266484989186a647c7539658e2a66dbeee305a/contract';
import startContract from '../../snapshots/dccb322febcc11c39d7482b29b266484989186a647c7539658e2a66dbeee305a/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'DetalleMovimientos',
        column: col('margenAplicado', 'numeric(14,2)', {
          codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 14, scale: 2 } },
        }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
