#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/17028415d982be1561b9bb9fff860ff3f5160b0e417ccf87dbbb44e951f25125/contract';
import startContract from '../../snapshots/17028415d982be1561b9bb9fff860ff3f5160b0e417ccf87dbbb44e951f25125/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/76a9d7dabfe8a6e50c6aedebbbfbbca570e2b0cab6c402e23dcec2aa877f6c9b/contract';
import endContract from '../../snapshots/76a9d7dabfe8a6e50c6aedebbbfbbca570e2b0cab6c402e23dcec2aa877f6c9b/contract.json' with { type: 'json' };
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
        table: 'Clientes',
        constraint: 'Clientes_personaId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Contactos',
        constraint: 'Contactos_personaId_fkey',
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
        constraint: 'Orden_tecnicoId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Presupuestos',
        constraint: 'Presupuestos_diagnosticoId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Usuarios',
        constraint: 'Usuarios_personasId_fkey',
        kind: 'foreignKey',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_codigoOrden_key',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'Presupuestos',
        constraint: 'Presupuestos_version_key',
      }),
      this.dropColumn({ schema: 'public', table: 'Actividades', column: 'precioAplicado' }),
      this.dropTable({ schema: 'public', table: 'Aprobaciones' }),
      this.dropIndex({
        schema: 'public',
        table: 'Clientes',
        index: 'Clientes_personaId_idx_758ca1fb',
      }),
      this.dropColumn({ schema: 'public', table: 'Clientes', column: 'personaId' }),
      this.dropIndex({
        schema: 'public',
        table: 'Contactos',
        index: 'Contactos_personaId_idx_758ca1fb',
      }),
      this.dropColumn({ schema: 'public', table: 'Contactos', column: 'personaId' }),
      this.dropDefault({ schema: 'public', table: 'DetalleMovimientos', column: 'cantidad' }),
      this.dropIndex({
        schema: 'public',
        table: 'Inventario',
        index: 'Inventario_repuestoId_idx_3de6f292',
      }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Movimientos',
        constraint: 'Movimientos_tipo_check_ca9d8d70',
      }),
      this.dropColumn({ schema: 'public', table: 'Orden', column: 'acesoriosRecibidos' }),
      this.dropColumn({ schema: 'public', table: 'Orden', column: 'estadoFisico' }),
      this.dropTable({ schema: 'public', table: 'Empleados' }),
      this.dropColumn({ schema: 'public', table: 'Orden', column: 'codigoOrden' }),
      this.dropTable({ schema: 'public', table: 'Pagos' }),
      this.dropTable({ schema: 'public', table: 'PresupuestoRepuestos' }),
      this.dropTable({ schema: 'public', table: 'PresupuestoServicios' }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Presupuestos',
        constraint: 'Presupuestos_estado_check_8b256946',
      }),
      this.dropColumn({ schema: 'public', table: 'Presupuestos', column: 'descuento' }),
      this.dropColumn({ schema: 'public', table: 'Presupuestos', column: 'fecha' }),
      this.dropTable({ schema: 'public', table: 'Diagnosticos' }),
      this.dropIndex({
        schema: 'public',
        table: 'Presupuestos',
        index: 'Presupuestos_diagnosticoId_idx_112223d0',
      }),
      this.dropColumn({ schema: 'public', table: 'Presupuestos', column: 'diagnosticoId' }),
      this.dropTable({ schema: 'public', table: 'Problemas' }),
      this.dropColumn({ schema: 'public', table: 'Repuestos', column: 'precioActual' }),
      this.dropTable({ schema: 'public', table: 'RepuestosAplicados' }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'Servicios',
        constraint: 'Servicios_categoria_check_12d8f900',
      }),
      this.dropColumn({ schema: 'public', table: 'Servicios', column: 'categoria' }),
      this.dropColumn({ schema: 'public', table: 'Servicios', column: 'precioBase' }),
      this.dropTable({ schema: 'public', table: 'Personas' }),
      this.dropIndex({
        schema: 'public',
        table: 'Usuarios',
        index: 'Usuarios_personasId_idx_d2a05eb0',
      }),
      this.dropColumn({ schema: 'public', table: 'Usuarios', column: 'personasId' }),
      this.createTable({
        schema: 'public',
        table: 'DetallePresupuesto',
        columns: [
          col('cantidad', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('descripcion', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('precioUnitario', 'numeric(10,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('presupuestoId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('repuestoId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('servicioId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'Actividades',
        column: col('precioUnitario', 'numeric(10,2)', {
          notNull: true,
          default: lit('0.00'),
          codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Clientes',
        column: col('direccion', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'DetalleMovimientos',
        column: col('precioUnitario', 'numeric(10,2)', {
          default: lit('0.00'),
          codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('accesoriosRecibidos', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('condicionDispositivo', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('descuentoAplicado', 'numeric(10,2)', {
          notNull: true,
          default: lit('0.00'),
          codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('diagnostico', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('entregaConfirmada', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('estadoPago', 'text', {
          notNull: true,
          default: lit('PENDIENTE'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('fechaFinalizacion', 'timestamptz(3)', {
          codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('fechaPago', 'timestamptz(3)', {
          codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('metodoPago', 'text', {
          notNull: true,
          default: lit('EFECTIVO'),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('servicioSolicitadoId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Orden',
        column: col('trabajoVerficado', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Presupuestos',
        column: col('fechaRegistro', 'timestamptz(3)', {
          notNull: true,
          default: fn(sql`now()`),
          codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Presupuestos',
        column: col('fechaRespuesta', 'timestamptz(3)', {
          codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Repuestos',
        column: col('costoActual', 'numeric(10,2)', {
          notNull: true,
          default: lit('0.00'),
          codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Repuestos',
        column: col('precioReferencial', 'numeric(10,2)', {
          notNull: true,
          default: lit('0.00'),
          codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'Servicios',
        column: col('precioReferencial', 'numeric(10,2)', {
          notNull: true,
          default: lit('0.00'),
          codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
        }),
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Clientes',
        column: 'ciudad',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Clientes',
        column: 'nombre',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
      this.addRequiredColumnToEmptyTable({
        schema: 'public',
        table: 'Contactos',
        column: 'clienteId',
        type: 'int4',
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Movimientos',
        column: 'updatedAt',
        type: 'timestamptz(3)',
        temporaryDefault: sql`'epoch'`,
      }),
      this.addRequiredColumnToEmptyTable({
        schema: 'public',
        table: 'Orden',
        column: 'codigo',
        type: 'text',
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Orden',
        column: 'problemasReportados',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
      this.addRequiredColumnToEmptyTable({
        schema: 'public',
        table: 'Presupuestos',
        column: 'ordenId',
        type: 'int4',
      }),
      this.addRequiredColumnToEmptyTable({
        schema: 'public',
        table: 'Usuarios',
        column: 'DNI',
        type: 'text',
      }),
      this.addColumnWithTemporaryDefault({
        schema: 'public',
        table: 'Usuarios',
        column: 'nombre',
        type: 'text',
        temporaryDefault: sql`''`,
      }),
      this.addRequiredColumnToEmptyTable({
        schema: 'public',
        table: 'Usuarios',
        column: 'rol',
        type: 'text',
      }),
      this.removeStoredValue({
        schema: 'public',
        table: 'Movimientos',
        column: 'tipo',
        value: 'TRANSFERENCIA',
        codecRef: { codecId: 'pg/text@1' },
        enumValue: { namespaceId: 'public', enum: 'TipoMovimiento', member: 'TRANSFERENCIA' },
      }),
      this.addUnique({
        schema: 'public',
        table: 'Inventario',
        constraint: 'Inventario_repuestoId_key',
        columns: ['repuestoId'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Movimientos',
        constraint: 'Movimientos_tipo_check_a6d87e5a',
        expression: sql`"tipo" IN ('ENTRADA', 'SALIDA', 'SALIDA_REPARACION', 'SALIDA_VENTA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_estadoPago_check_19cfff96',
        expression: sql`"estadoPago" IN ('PENDIENTE', 'PAGADO')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_metodoPago_check_bd9becdf',
        expression: sql`"metodoPago" IN ('EFECTIVO', 'TARJETA', 'QR')`,
      }),
      this.addUnique({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_codigo_key',
        columns: ['codigo'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Presupuestos',
        constraint: 'Presupuestos_estado_check_471fe83c',
        expression: sql`"estado" IN ('PENDIENTE_APROBACION', 'APROBADO', 'RECHAZADO', 'CANCELADO')`,
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'Usuarios',
        constraint: 'Usuarios_rol_check_e20a97be',
        expression: sql`"rol" IN ('ADMINISTRADOR', 'TECNICO', 'RECEPCIONISTA', 'ALMACENISTA')`,
      }),
      this.addUnique({
        schema: 'public',
        table: 'Usuarios',
        constraint: 'Usuarios_DNI_key',
        columns: ['DNI'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Contactos',
        index: 'Contactos_clienteId_idx_7ae16308',
        columns: ['clienteId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'DetallePresupuesto',
        index: 'DetallePresupuesto_presupuestoId_idx_f5e95d09',
        columns: ['presupuestoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'DetallePresupuesto',
        index: 'DetallePresupuesto_repuestoId_idx_3de6f292',
        columns: ['repuestoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'DetallePresupuesto',
        index: 'DetallePresupuesto_servicioId_idx_70be2758',
        columns: ['servicioId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Orden',
        index: 'Orden_servicioSolicitadoId_idx_badf2823',
        columns: ['servicioSolicitadoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Presupuestos',
        index: 'Presupuestos_ordenId_idx_b087098b',
        columns: ['ordenId'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Contactos',
        foreignKey: {
          name: 'Contactos_clienteId_fkey',
          columns: ['clienteId'],
          references: { schema: 'public', table: 'Clientes', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'DetallePresupuesto',
        foreignKey: {
          name: 'DetallePresupuesto_presupuestoId_fkey',
          columns: ['presupuestoId'],
          references: { schema: 'public', table: 'Presupuestos', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'DetallePresupuesto',
        foreignKey: {
          name: 'DetallePresupuesto_servicioId_fkey',
          columns: ['servicioId'],
          references: { schema: 'public', table: 'Servicios', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'DetallePresupuesto',
        foreignKey: {
          name: 'DetallePresupuesto_repuestoId_fkey',
          columns: ['repuestoId'],
          references: { schema: 'public', table: 'Repuestos', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Orden',
        foreignKey: {
          name: 'Orden_recepcionistaId_fkey',
          columns: ['recepcionistaId'],
          references: { schema: 'public', table: 'Usuarios', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Orden',
        foreignKey: {
          name: 'Orden_servicioSolicitadoId_fkey',
          columns: ['servicioSolicitadoId'],
          references: { schema: 'public', table: 'Servicios', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Orden',
        foreignKey: {
          name: 'Orden_tecnicoId_fkey',
          columns: ['tecnicoId'],
          references: { schema: 'public', table: 'Usuarios', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'Presupuestos',
        foreignKey: {
          name: 'Presupuestos_ordenId_fkey',
          columns: ['ordenId'],
          references: { schema: 'public', table: 'Orden', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
