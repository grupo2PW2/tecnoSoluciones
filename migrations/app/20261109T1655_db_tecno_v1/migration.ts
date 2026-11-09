#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/42631c08e1d27822c64f6514e6ab8c92427693464f18806990bb7f5076e970be/contract';
import startContract from '../../snapshots/42631c08e1d27822c64f6514e6ab8c92427693464f18806990bb7f5076e970be/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/85f292845dae68dd0b18bb33a184563544485d777b6510ceb6301005a371bf9f/contract';
import endContract from '../../snapshots/85f292845dae68dd0b18bb33a184563544485d777b6510ceb6301005a371bf9f/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('ajustePrecio', 'float8', {
          notNull: true,
          default: lit(0),
          codecRef: { codecId: 'pg/float8@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('tipoAjuste', 'text', {
          notNull: true,
          default: lit('NORMAL'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_tipoAjuste_check_15f30b65',
        expression: sql`"tipoAjuste" IN ('DESCUENTO', 'RECARGO', 'NORMAL')`,
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
