#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/1bd9db97a5caa8f03cd976f45eadfb53d87a72bf3c9a452f4b5b1c114eadccbc/contract';
import endContract from '../../snapshots/1bd9db97a5caa8f03cd976f45eadfb53d87a72bf3c9a452f4b5b1c114eadccbc/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/76a9d7dabfe8a6e50c6aedebbbfbbca570e2b0cab6c402e23dcec2aa877f6c9b/contract';
import startContract from '../../snapshots/76a9d7dabfe8a6e50c6aedebbbfbbca570e2b0cab6c402e23dcec2aa877f6c9b/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropConstraint({
        schema: 'public',
        table: 'Actividades',
        constraint: 'Actividades_ordenId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Actividades',
        constraint: 'Actividades_servicioId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'DetalleMovimientos',
        constraint: 'DetalleMovimientos_movimientoId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'DetalleMovimientos',
        constraint: 'DetalleMovimientos_repuestoId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Dispositivos',
        constraint: 'Dispositivos_clienteId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Inventario',
        constraint: 'Inventario_repuestoId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Movimientos',
        constraint: 'Movimientos_ordenId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_dispositivoId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_recepcionistaId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_servicioSolicitadoId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_tecnicoId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Presupuestos',
        constraint: 'Presupuestos_ordenId_fkey',
        kind: 'foreignKey',
      }),
      this.dropColumn({ schema: 'public', table: 'Clientes', column: 'ciudad' }),
      this.dropTable({ schema: 'public', table: 'Contactos' }),
      this.dropTable({ schema: 'public', table: 'DetallePresupuesto' }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Dispositivos',
        constraint: 'Dispositivos_tipo_check_66390572',
      }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_estadoPago_check_19cfff96',
      }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_estado_check_e217ed51',
      }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_metodoPago_check_bd9becdf',
      }),
      this.dropColumn({ schema: 'public', table: 'Orden', column: 'diagnostico' }),
      this.dropColumn({ schema: 'public', table: 'Orden', column: 'entregaConfirmada' }),
      this.dropColumn({ schema: 'public', table: 'Orden', column: 'estadoPago' }),
      this.dropColumn({ schema: 'public', table: 'Orden', column: 'fechaFinalizacion' }),
      this.dropColumn({ schema: 'public', table: 'Orden', column: 'fechaPago' }),
      this.dropColumn({ schema: 'public', table: 'Orden', column: 'metodoPago' }),
      this.dropColumn({ schema: 'public', table: 'Orden', column: 'trabajoVerficado' }),
      this.dropIndex({
        schema: 'public',
        table: 'Orden',
        index: 'Orden_servicioSolicitadoId_idx_badf2823',
      }),
      this.dropColumn({ schema: 'public', table: 'Orden', column: 'servicioSolicitadoId' }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Repuestos',
        constraint: 'Repuestos_estado_check_acb59f2a',
      }),
      this.dropColumn({ schema: 'public', table: 'Repuestos', column: 'precioReferencial' }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Usuarios',
        constraint: 'Usuarios_rol_check_e20a97be',
      }),
      this.createTable({
        schema: 'public',
        table: 'Configuracion',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('margenGanancia', 'numeric(5,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 5, scale: 2 } },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'PresupuestoRepuesto',
        columns: [
          col('cantidad', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('precioUnitario', 'numeric(10,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('presupuestoId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('repuestoId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['presupuestoId', 'repuestoId'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'PresupuestoServicio',
        columns: [
          col('cantidad', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('precioUnitario', 'numeric(10,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('presupuestoId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('servicioId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['presupuestoId', 'servicioId'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'Actividades',
        column: col('trabajoVerificado', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Clientes',
        column: col('createdAt', 'timestamptz(3)', {
          notNull: true,
          default: fn(sql`now()`),
          codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Clientes',
        column: col('telefono', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Presupuestos',
        column: col('total', 'numeric(10,2)', {
          notNull: true,
          default: lit('0.00'),
          codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Repuestos',
        column: col('precioVenta', 'numeric(10,2)', {
          notNull: true,
          default: lit('0.00'),
          codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Usuarios',
        column: col('telefono', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Clientes',
        column: 'apellido',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Clientes',
        column: 'updatedAt',
        type: 'timestamptz(3)',
        temporaryDefault: sql`'epoch'`,
      }),
      this.addRequiredColumnToEmptyTable({
        schema: 'public',
        table: 'Orden',
        column: 'codigoCliente',
        type: 'text',
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Usuarios',
        column: 'apellido',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
      this.removeStoredValue({
        schema: 'public',
        table: 'Orden',
        column: 'estado',
        value: 'EN_PROCESO',
        codecRef: { codecId: 'pg/text@1' },
        enumValue: { namespaceId: 'public', enum: 'EstadoOrden', member: 'EN_PROCESO' },
      }),
      this.removeStoredValue({
        schema: 'public',
        table: 'Orden',
        column: 'estado',
        value: 'DIAGNOSTICADO',
        codecRef: { codecId: 'pg/text@1' },
        enumValue: { namespaceId: 'public', enum: 'EstadoOrden', member: 'DIAGNOSTICADO' },
      }),
      this.removeStoredValue({
        schema: 'public',
        table: 'Orden',
        column: 'estado',
        value: 'LISTO_PARA_ENTREGA',
        codecRef: { codecId: 'pg/text@1' },
        enumValue: { namespaceId: 'public', enum: 'EstadoOrden', member: 'LISTO_PARA_ENTREGA' },
      }),
      this.removeStoredValue({
        schema: 'public',
        table: 'Repuestos',
        column: 'estado',
        value: 'EN_REPARACION',
        codecRef: { codecId: 'pg/text@1' },
        enumValue: { namespaceId: 'public', enum: 'EstadoRepuesto', member: 'EN_REPARACION' },
      }),
      this.removeStoredValue({
        schema: 'public',
        table: 'Usuarios',
        column: 'rol',
        value: 'ALMACENISTA',
        codecRef: { codecId: 'pg/text@1' },
        enumValue: { namespaceId: 'public', enum: 'Rol', member: 'ALMACENISTA' },
      }),
      this.removeStoredValue({
        schema: 'public',
        table: 'Dispositivos',
        column: 'tipo',
        value: 'NOTEBOOK',
        codecRef: { codecId: 'pg/text@1' },
        enumValue: { namespaceId: 'public', enum: 'TipoDispotivo', member: 'NOTEBOOK' },
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Dispositivos',
        constraint: 'Dispositivos_tipo_check_c72aa4c8',
        expression: sql`"tipo" IN ('COMPUTADORA', 'CELULAR', 'LAPTOP', 'TABLET', 'SMARTWATCH', 'IMPRESORA', 'SCANNER', 'OTRO')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_estado_check_4cacc206',
        expression: sql`"estado" IN ('RECIBIDO', 'EN_DIAGNOSTICO', 'PENDIENTE_APROBACION', 'APROBADO', 'RECHAZADO', 'EN_REPARACION', 'ESPERANDO_REPUESTO', 'LISTO', 'ENTREGADO', 'CANCELADO')`,
      }),
      this.addUnique({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_codigoCliente_key',
        columns: ['codigoCliente'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Repuestos',
        constraint: 'Repuestos_estado_check_9c1e9b0a',
        expression: sql`"estado" IN ('DISPONIBLE', 'AGOTADO', 'EN_REPOSICION', 'DESCATALOGADO')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Usuarios',
        constraint: 'Usuarios_rol_check_354854ec',
        expression: sql`"rol" IN ('ADMINISTRADOR', 'TECNICO', 'RECEPCIONISTA', 'GERENTE')`,
      }),
      this.createIndex({
        schema: 'public',
        table: 'PresupuestoRepuesto',
        index: 'PresupuestoRepuesto_presupuestoId_idx_f5e95d09',
        columns: ['presupuestoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PresupuestoRepuesto',
        index: 'PresupuestoRepuesto_repuestoId_idx_3de6f292',
        columns: ['repuestoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PresupuestoServicio',
        index: 'PresupuestoServicio_presupuestoId_idx_f5e95d09',
        columns: ['presupuestoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'PresupuestoServicio',
        index: 'PresupuestoServicio_servicioId_idx_70be2758',
        columns: ['servicioId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Actividades',
        foreignKey: {
          name: 'Actividades_ordenId_fkey',
          columns: ['ordenId'],
          references: { schema: 'public', table: 'Orden', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Actividades',
        foreignKey: {
          name: 'Actividades_servicioId_fkey',
          columns: ['servicioId'],
          references: { schema: 'public', table: 'Servicios', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'DetalleMovimientos',
        foreignKey: {
          name: 'DetalleMovimientos_movimientoId_fkey',
          columns: ['movimientoId'],
          references: { schema: 'public', table: 'Movimientos', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'DetalleMovimientos',
        foreignKey: {
          name: 'DetalleMovimientos_repuestoId_fkey',
          columns: ['repuestoId'],
          references: { schema: 'public', table: 'Repuestos', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Dispositivos',
        foreignKey: {
          name: 'Dispositivos_clienteId_fkey',
          columns: ['clienteId'],
          references: { schema: 'public', table: 'Clientes', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Inventario',
        foreignKey: {
          name: 'Inventario_repuestoId_fkey',
          columns: ['repuestoId'],
          references: { schema: 'public', table: 'Repuestos', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Movimientos',
        foreignKey: {
          name: 'Movimientos_ordenId_fkey',
          columns: ['ordenId'],
          references: { schema: 'public', table: 'Orden', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Orden',
        foreignKey: {
          name: 'Orden_dispositivoId_fkey',
          columns: ['dispositivoId'],
          references: { schema: 'public', table: 'Dispositivos', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Orden',
        foreignKey: {
          name: 'Orden_recepcionistaId_fkey',
          columns: ['recepcionistaId'],
          references: { schema: 'public', table: 'Usuarios', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Orden',
        foreignKey: {
          name: 'Orden_tecnicoId_fkey',
          columns: ['tecnicoId'],
          references: { schema: 'public', table: 'Usuarios', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PresupuestoRepuesto',
        foreignKey: {
          name: 'PresupuestoRepuesto_presupuestoId_fkey',
          columns: ['presupuestoId'],
          references: { schema: 'public', table: 'Presupuestos', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PresupuestoRepuesto',
        foreignKey: {
          name: 'PresupuestoRepuesto_repuestoId_fkey',
          columns: ['repuestoId'],
          references: { schema: 'public', table: 'Repuestos', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PresupuestoServicio',
        foreignKey: {
          name: 'PresupuestoServicio_presupuestoId_fkey',
          columns: ['presupuestoId'],
          references: { schema: 'public', table: 'Presupuestos', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'PresupuestoServicio',
        foreignKey: {
          name: 'PresupuestoServicio_servicioId_fkey',
          columns: ['servicioId'],
          references: { schema: 'public', table: 'Servicios', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Presupuestos',
        foreignKey: {
          name: 'Presupuestos_ordenId_fkey',
          columns: ['ordenId'],
          references: { schema: 'public', table: 'Orden', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
