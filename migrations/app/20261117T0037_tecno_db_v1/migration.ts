#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/696e58316d4f3cc1dfbc4112f8cf7f071eebd734cd427c87a263631bcd42697d/contract';
import startContract from '../../snapshots/696e58316d4f3cc1dfbc4112f8cf7f071eebd734cd427c87a263631bcd42697d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/b47e61ec36aad4a39885fcc469d96821a4bcfaa6bd2787d4ef9ca43fc22e6790/contract';
import endContract from '../../snapshots/b47e61ec36aad4a39885fcc469d96821a4bcfaa6bd2787d4ef9ca43fc22e6790/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, sql } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropNotNull({ schema: 'public', table: 'DetallePresupuesto', column: 'servicioId' }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'DetallePresupuesto',
        constraint: 'detalle_presupuesto_un_concepto_59f65598',
        expression: sql`("servicioId" IS NOT NULL AND "repuestoId" IS NULL) OR ("servicioId" IS NULL AND "repuestoId" IS NOT NULL)`,
      }),
      this.addUnique({
        schema: 'public',
        table: 'Presupuestos',
        constraint: 'Presupuestos_ordenId_version_key',
        columns: ['ordenId', 'version'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
