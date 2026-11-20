#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/711be29f2279792d3091c4393bbeaffbe787bab6bfd8b5a9e2dac6738979c7e6/contract';
import endContract from '../../snapshots/711be29f2279792d3091c4393bbeaffbe787bab6bfd8b5a9e2dac6738979c7e6/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'Clientes',
        columns: [
          col('apellido', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('direccion', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nombre', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('telefono', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
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
        table: 'DetalleMovimientos',
        columns: [
          col('cantidad', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('costoUnitario', 'numeric(10,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('movimientoId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('precioUnitario', 'numeric(10,2)', {
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('repuestoId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Dispositivos',
        columns: [
          col('clienteId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('imgUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('marca', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('modelo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nroSerie', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('tipo', 'text', {
            notNull: true,
            default: lit('OTRO'),
            codecRef: { codecId: 'pg/text@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Dispositivos_tipo_check_c72aa4c8',
            sql`"tipo" IN ('COMPUTADORA', 'CELULAR', 'LAPTOP', 'TABLET', 'SMARTWATCH', 'IMPRESORA', 'SCANNER', 'OTRO')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Inventario',
        columns: [
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('repuestoId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('stock', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('stockMinimo', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
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
        table: 'Movimientos',
        columns: [
          col('fecha', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('observaciones', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ordenId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('registradoPorId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('tipo', 'text', {
            notNull: true,
            default: lit('SALIDA'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Movimientos_tipo_check_a6d87e5a',
            sql`"tipo" IN ('ENTRADA', 'SALIDA', 'SALIDA_REPARACION', 'SALIDA_VENTA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Orden',
        columns: [
          col('accesoriosRecibidos', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('codigo', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('codigoCliente', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('condicionDispositivo', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('dispositivoId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('entregadoPorId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('estado', 'text', {
            notNull: true,
            default: lit('RECIBIDO'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('fechaCierreTecnico', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('fechaEntregaCliente', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('fechaIngreso', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('montoCobrado', 'numeric(10,2)', {
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('motivoCancelacion', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('problemasReportados', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('recepcionistaId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('tecnicoId', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Orden_estado_check_e7ba5515',
            sql`"estado" IN ('RECIBIDO', 'EN_DIAGNOSTICO', 'PENDIENTE_APROBACION', 'APROBADO', 'RECHAZADO', 'RECHAZADO_ENTREGADO', 'EN_REPARACION', 'LISTO', 'ENTREGADO', 'CANCELADO')`,
          ),
        ],
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
          col('estado', 'text', {
            notNull: true,
            default: lit('PRESUPUESTADO'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('fechaFinalizacion', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('fechaInicio', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('observaciones', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('precioUnitario', 'numeric(10,2)', {
            notNull: true,
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('presupuestoId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('servicioId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('trabajoVerificado', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
        ],
        constraints: [
          primaryKey(['presupuestoId', 'servicioId']),
          checkExpression(
            'PresupuestoServicio_estado_check_386747a7',
            sql`"estado" IN ('PRESUPUESTADO', 'PENDIENTE_EJECUCION', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Presupuestos',
        columns: [
          col('canalRespuesta', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('descuentoDiagnostico', 'numeric(10,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('estado', 'text', {
            notNull: true,
            default: lit('BORRADOR'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('fechaEstimadaEntrega', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('fechaPresentacion', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('fechaRegistro', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('fechaRespuesta', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('fechaVencimiento', 'timestamptz(3)', {
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('montoRecargo', 'numeric(10,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('observaciones', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('ordenId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('porcentajeRecargo', 'numeric(5,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 5, scale: 2 } },
          }),
          col('prioridad', 'text', {
            notNull: true,
            default: lit('BAJA'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('tipo', 'text', {
            notNull: true,
            default: lit('PRINCIPAL'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('total', 'numeric(10,2)', {
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('version', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Presupuestos_canalRespuesta_check_e3cecb30',
            sql`"canalRespuesta" IN ('EN_TIENDA', 'WEB')`,
          ),
          checkExpression(
            'Presupuestos_estado_check_f0699f77',
            sql`"estado" IN ('BORRADOR', 'PENDIENTE_APROBACION', 'APROBADO', 'RECHAZADO', 'VENCIDO', 'CANCELADO')`,
          ),
          checkExpression(
            'Presupuestos_prioridad_check_40efccaa',
            sql`"prioridad" IN ('BAJA', 'MEDIA', 'ALTA')`,
          ),
          checkExpression(
            'Presupuestos_tipo_check_3f4f4cb4',
            sql`"tipo" IN ('PRINCIPAL', 'ADICIONAL')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Repuestos',
        columns: [
          col('costoActual', 'numeric(10,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('estado', 'text', {
            notNull: true,
            default: lit('DISPONIBLE'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('imgUrl', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nombre', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('precioVenta', 'numeric(10,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
          col('sku', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('unidadesCaja', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Repuestos_estado_check_9c1e9b0a',
            sql`"estado" IN ('DISPONIBLE', 'AGOTADO', 'EN_REPOSICION', 'DESCATALOGADO')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'Servicios',
        columns: [
          col('activo', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('descripcion', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nombre', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('precioReferencial', 'numeric(10,2)', {
            notNull: true,
            default: lit('0.00'),
            codecRef: { codecId: 'pg/numeric@1', typeParams: { precision: 10, scale: 2 } },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'Usuarios',
        columns: [
          col('DNI', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('activo', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('apellido', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('avatar', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz(3)', {
            notNull: true,
            default: fn(sql`now()`),
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nombre', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('rol', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('telefono', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz(3)', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1', typeParams: { precision: 3 } },
          }),
          col('username', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'Usuarios_rol_check_354854ec',
            sql`"rol" IN ('ADMINISTRADOR', 'TECNICO', 'RECEPCIONISTA', 'GERENTE')`,
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Dispositivos',
        constraint: 'Dispositivos_nroSerie_key',
        columns: ['nroSerie'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Inventario',
        constraint: 'Inventario_repuestoId_key',
        columns: ['repuestoId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_codigo_key',
        columns: ['codigo'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Orden',
        constraint: 'Orden_codigoCliente_key',
        columns: ['codigoCliente'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Presupuestos',
        constraint: 'Presupuestos_ordenId_version_key',
        columns: ['ordenId', 'version'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Repuestos',
        constraint: 'Repuestos_sku_key',
        columns: ['sku'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Servicios',
        constraint: 'Servicios_nombre_key',
        columns: ['nombre'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Usuarios',
        constraint: 'Usuarios_DNI_key',
        columns: ['DNI'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'Usuarios',
        constraint: 'Usuarios_username_key',
        columns: ['username'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'DetalleMovimientos',
        index: 'DetalleMovimientos_movimientoId_idx_cf1459a7',
        columns: ['movimientoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'DetalleMovimientos',
        index: 'DetalleMovimientos_repuestoId_idx_3de6f292',
        columns: ['repuestoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Dispositivos',
        index: 'Dispositivos_clienteId_idx_7ae16308',
        columns: ['clienteId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Movimientos',
        index: 'Movimientos_ordenId_idx_b087098b',
        columns: ['ordenId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Movimientos',
        index: 'Movimientos_registradoPorId_idx_36896e05',
        columns: ['registradoPorId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Orden',
        index: 'Orden_dispositivoId_idx_d98b2f4f',
        columns: ['dispositivoId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Orden',
        index: 'Orden_entregadoPorId_idx_94c78303',
        columns: ['entregadoPorId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Orden',
        index: 'Orden_recepcionistaId_idx_158f4fd1',
        columns: ['recepcionistaId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Orden',
        index: 'Orden_tecnicoId_fechaCierreTecnico_idx_53a52a5e',
        columns: ['tecnicoId', 'fechaCierreTecnico'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'Orden',
        index: 'Orden_tecnicoId_idx_e983d88c',
        columns: ['tecnicoId'],
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
      this.createIndex({
        schema: 'public',
        table: 'Presupuestos',
        index: 'Presupuestos_ordenId_idx_b087098b',
        columns: ['ordenId'],
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
          name: 'Movimientos_registradoPorId_fkey',
          columns: ['registradoPorId'],
          references: { schema: 'public', table: 'Usuarios', columns: ['id'] },
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
          name: 'Orden_entregadoPorId_fkey',
          columns: ['entregadoPorId'],
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
          name: 'Orden_dispositivoId_fkey',
          columns: ['dispositivoId'],
          references: { schema: 'public', table: 'Dispositivos', columns: ['id'] },
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
