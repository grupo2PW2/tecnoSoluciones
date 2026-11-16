<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — TecnoSoluciones

## 1. Propósito y prioridad

Este repositorio contiene **TecnoSoluciones**, una aplicación web de gestión de atención y servicios técnicos de equipos electrónicos.

Trabaja como desarrollador senior **dentro de la arquitectura existente**, sin reestructurar el proyecto por iniciativa propia. El objetivo es implementar el sistema **módulo por módulo**, con cambios pequeños, coherentes y sin trabajo repetitivo.

Orden de prioridad ante conflictos:
1. Instrucciones explícitas del usuario para la tarea actual.
2. Reglas de negocio y decisiones fijadas en este archivo.
3. `ARCHITECTURE.md` y convenciones ya presentes en el repositorio.
4. Contrato de datos real y migraciones existentes.
5. Convenciones generales del ecosistema.

**Antes de cualquier tarea**, leer este archivo y `ARCHITECTURE.md` (si está en el repositorio), inspeccionar únicamente los archivos pertinentes y verificar el estado real del módulo. Si una regla contradice el contrato existente, informar la diferencia y proponer una corrección; no decidir silenciosamente.

## 2. Stack y estructura existente

- Next.js con **App Router**, React y TypeScript estricto.
- Prisma ORM **8** y PostgreSQL.
- Tailwind CSS y **shadcn/ui**; iconos de `lucide-react`.
- Conservar la tipografía **Titillium Web**, tokens, estilos globales y componentes existentes.
- Consultar las versiones instaladas en `package.json`; no asumir que un ejemplo de otra versión es compatible.

Respetar la organización documentada en `ARCHITECTURE.md`:

- `app/(auth)/`: autenticación.
- `app/(dashboard)/dashboard/`: panel administrativo.
- `app/(dashboard)/clientes/`, `diagnosticos/`, `dispositivos/`, `inventario/`, `movimientos/`, `ordenes/`, `repuestos/`, `servicios/`, `usuarios/`: módulos existentes.
- `app/(publico)/orden/[codigo]/`: consulta pública de una orden. El parámetro de la URL debe tratarse como **credencial de consulta**, no como identificador administrativo secuencial.
- `components/`: componentes compartidos de aplicación.
- `components/ui/`: controles genéricos de shadcn/ui.
- `hooks/`: hooks compartidos.
- `lib/`: utilidades generales.
- `src/prisma/`: contrato, conexión y artefactos Prisma.
- `migrations/`: historial de migraciones.

Los grupos de rutas `(auth)`, `(dashboard)` y `(publico)` no forman parte de la URL.

**No migrar carpetas ni introducir una arquitectura nueva** sin una necesidad concreta y aprobación. No crear carpetas `services`, `repositories`, `actions`, `schemas`, etc. por costumbre: primero revisar cómo está organizado el código y extraer responsabilidades solo cuando ayude al módulo.

## 3. Principios de implementación

- Server Components por defecto; `"use client"` solo para interactividad necesaria.
- La lógica de negocio, autorización y acceso a datos se ejecuta en el servidor, nunca en componentes cliente.
- Reutilizar `components/ui/` y componentes existentes antes de crear otros.
- Mantener páginas como composición; separar UI y lógica cuando aporte claridad real.
- Usar los tipos existentes y TypeScript estricto; evitar `any` y casts inseguros.
- Respetar las convenciones del proyecto: nombres del dominio en español, componentes en PascalCase, funciones/variables en camelCase, rutas en minúsculas, imports `@/`, `import type` cuando proceda.
- No duplicar formularios, consultas, cálculos, validaciones, estados, componentes ni reglas que ya existan.
- No añadir paquetes, bibliotecas visuales, abstracciones, capas, hooks o utilidades que no aporten valor a la tarea.
- Utilizar los patrones de validación ya instalados; validar siempre en servidor además de la UI.
- Utilizar los estilos y tokens existentes en vez de introducir diseños inconexos.

## 4. Fuente de verdad de base de datos — Prisma 8

La fuente **editable** del modelo es `src/prisma/contract.prisma`, **no** `schema.prisma`.

- `src/prisma/contract.json` y `src/prisma/contract.d.ts` son **generados**: nunca editarlos a mano.
- `src/prisma/db.ts` centraliza conexión y acceso a PostgreSQL mediante `DATABASE_URL`. No abrir conexiones paralelas.
- Usar enums, relaciones, nombres, optionalidad, identificadores y `NumericString(10, 2)` definidos por el contrato. No inventar campos o valores de enum.
- No sustituir comandos del flujo de Prisma 8 por instrucciones antiguas de Prisma 6/7.
- Respetar las **13 entidades aprobadas**: `Clientes`, `Contactos`, `Dispositivos`, `Usuarios`, `Orden`, `Servicios`, `Actividades`, `Presupuestos`, `DetallePresupuesto`, `Repuestos`, `Inventario`, `Movimientos` y `DetalleMovimientos`. Confirmar sus nombres técnicos exactos en `contract.prisma` antes de usarlos.
- No agregar tablas de pagos, historial de estados, cuentas de cliente, empleados, almacenes, presupuestos separados por tipo ni responsables técnicos por actividad.
- No cambiar relaciones ni columnas sin autorización expresa. Si falta un campo aprobado (por ejemplo `codigoCliente`), señalarlo antes de editar el contrato.

**Si el usuario autoriza un cambio de esquema**, seguir el procedimiento existente:
1. Editar `src/prisma/contract.prisma`.
2. Ejecutar `npx prisma contract emit` (o `npm run contract:emit` si existe).
3. Crear un plan con `npx prisma migration plan --name <nombre>`.
4. Revisar el plan; no ejecutar migraciones destructivas sin autorización específica.
5. Aplicar en desarrollo, solo con autorización, mediante `npx prisma db migrate --advance-ref db`.
6. No modificar migraciones históricas ni archivos generados a mano.

Estos comandos son **pasos de una modificación de esquema**, no verificaciones de calidad ni permiso para cambiar el esquema por iniciativa propia.

## 5. Roles y permisos

Roles del personal: **administrador, recepción, técnico y gerente**; usar los valores exactos del enum real.

- **Administrador:** administración de usuarios, supervisión y operaciones autorizadas del sistema.
- **Recepción:** clientes, contactos, dispositivos, ingreso de órdenes, ticket, inventario, cobro y entrega.
- **Técnico:** visualizar órdenes disponibles, autoasignarse órdenes, diagnosticar, registrar sus actividades, usar repuestos en sus órdenes y finalizar/verificar trabajos.
- **Gerente:** consultar reportes e información de supervisión según sus permisos.

No existe rol de almacén. No existen cuentas de usuario para clientes.

Comprobar **autenticación y autorización en servidor en cada operación protegida**. Ocultar un botón no equivale a autorizar una operación.

## 6. Recepción, ticket y consulta pública

1. Recepción registra o selecciona `Clientes`, `Contactos` y `Dispositivos`.
2. Registra `Orden` con servicio solicitado, problemas, condición del dispositivo, accesorios, prioridad y otros campos aprobados.
3. La orden genera **dos identificadores únicos**:
   - `codigo`: identificador administrativo **secuencial**, legible (ej. `ORD-000125`).
   - `codigoCliente`: **credencial privada, aleatoria, criptográficamente segura y no predecible**, para consulta pública y autorización de presupuestos.
4. Recepción entrega un ticket imprimible con información de recepción y un QR/enlace o código privado de consulta.
5. El cliente, **sin iniciar sesión**, consulta el estado actual y la información estrictamente necesaria de su orden.
6. Si existe un presupuesto pendiente, el cliente puede **aprobarlo o rechazarlo**, confirmando explícitamente su decisión.

La consulta por `codigoCliente` debe limitar intentos, no revelar datos personales innecesarios y permitir rotación de la credencial si el ticket se pierde. Para decisiones económicas sensibles, aplicar verificación adicional por un medio de contacto registrado cuando corresponda. No implementar aprobación pública con solo el `codigo` secuencial.

## 7. Autoasignación de técnicos y capacidad

- Una orden nueva puede tener `tecnicoId = NULL`.
- El técnico **se autoasigna** una orden libre desde el servidor.
- Cada técnico puede mantener **máximo dos órdenes con trabajo técnico activo**.
- Una orden ocupa cupo mientras esté asignada y **no** cumpla simultáneamente:
  - `estado = listo_para_entrega` (valor real del enum), **y**
  - `trabajoVerificado = true`.
- Una orden correctamente **cancelada/cerrada** tampoco ocupa cupo.
- Una orden pendiente de presupuesto, aprobación o repuestos **sí ocupa cupo** inicialmente.
- La liberación de cupo ocurre al finalizar y verificar el trabajo técnico, **no** al cobrar ni entregar el equipo.
- Una vez lista y verificada, recepción asume el cobro y la entrega.
- Administración puede reasignar órdenes justificadamente, sin sobrepasar el límite de destino.
- Proteger autoasignación y conteo de cupos ante **peticiones concurrentes**, mediante una transacción y un mecanismo de serialización/bloqueo adecuado. No resolverlo solo en UI.
- Solo el técnico responsable puede modificar la ejecución técnica de su orden, salvo permisos administrativos explícitos.

## 8. Servicios, diagnóstico, actividades y presupuesto

- `Orden.servicioSolicitadoId` (o el nombre equivalente en el contrato) identifica el **servicio principal solicitado**.
- `Actividades` registra **trabajos efectivamente ejecutados**, con precio aplicado histórico.
- Una orden tiene un solo técnico responsable; **no** asignar técnicos por actividad.
- Un mantenimiento o servicio directo con **precio acordado** puede ejecutarse sin presupuesto formal.
- Si se realiza diagnóstico y se detectan **reparaciones o repuestos adicionales**, generar `Presupuestos` y `DetallePresupuesto` antes de ejecutarlas.
- El diagnóstico realizado se registra en la orden y como actividad cobrable cuando corresponda.
- El presupuesto es una **propuesta**, no constituye servicio ejecutado ni salida de inventario.
- Un presupuesto puede tener versiones; asegurar unicidad de `(ordenId, version)`.
- Cada línea de detalle representa **o** un servicio **o** un repuesto, nunca ambos ni ninguno.
- El cliente aprueba o rechaza la **versión concreta** desde su consulta segura.
- No comenzar reparaciones adicionales sin aprobación. No modificar importes de una versión ya enviada o aprobada: crear una nueva versión y solicitar nueva decisión.
- Si se rechaza la reparación, no ejecutarla; se cobra el diagnóstico y otros conceptos previamente aceptados si corresponden.
- Si una reparación excede el importe aprobado, solicitar una nueva autorización antes de ejecutar cargos adicionales.
- No duplicar el mismo cargo entre diagnóstico, actividades, presupuesto y consumo de repuestos.

## 9. Inventario, costos y precios

- `Repuestos`: catálogo, SKU, costo vigente y precio de referencia.
- `Inventario`: stock disponible y stock mínimo; relación uno a uno por repuesto.
- `Movimientos` + `DetalleMovimientos`: registro histórico de entradas y salidas.
- `costoUnitario`: costo de adquisición/valoración del repuesto en ese movimiento.
- `precioUnitario`: precio de venta aplicado cuando la salida es cobrable.
- El costo y precio histórico de los movimientos **no cambian** cuando se actualizan los valores de catálogo.
- Registrar consumos de reparación como movimientos de salida asociados a la orden.
- Un repuesto presupuestado **no** reduce stock; solo la salida efectivamente registrada lo hace.
- No permitir stock negativo; controlar concurrencia y actualizar movimiento/inventario **en una misma transacción**.
- Recepción y administrador realizan entradas y ajustes de inventario; el técnico puede registrar salidas de repuestos de sus propias órdenes.
- Antes de implementar la valoración de costo en salidas, confirmar el método contable acordado; no asumir FIFO o promedio sin definición.
- Mantener sincronizados `Inventario.stock` y el histórico de movimientos.

## 10. Importes, descuentos, pago y entrega

- **Subtotal de servicios:** suma de actividades cobrables finalizadas, considerando cantidad si el modelo la incluye.
- **Subtotal de repuestos:** suma de `cantidad × precioUnitario` para salidas de reparación cobrables de la orden, descontando devoluciones si se admiten.
- **Importe final:** `subtotalServicios + subtotalRepuestos - descuentoAplicado`.
- No sumar el presupuesto al importe realizado ni cobrar dos veces un mismo concepto.
- El diagnóstico se cobra si no se aprueba la reparación; si se aprueba, se aplica el descuento de diagnóstico **una sola vez**, según lo autorizado.
- No permitir descuentos superiores al subtotal ni importes finales negativos.
- Los precios acordados/aprobados prevalecen sobre actualizaciones posteriores del catálogo.
- El cliente paga **todo junto al recoger el dispositivo**; no hay pagos parciales ni tabla de pagos en esta versión.
- Guardar en la orden `estadoPago`, `fechaPago`, `metodoPago` y el descuento según el contrato; preservar el importe efectivamente cobrado cuando se confirme el pago, si el contrato contempla ese campo o cuando se apruebe agregarlo.
- Recepción registra pago, entrega y confirmación del cliente.
- Solo marcar `entregado` cuando se haya registrado el pago completo y `entregaConfirmada = true`.
- Proteger contra modificaciones arbitrarias de importes y consumos de una orden ya pagada/entregada.

## 11. Estados e historial

- Se conserva solamente el **estado actual** de cada orden. **No** crear una tabla de historial de cambios de estado.
- El historial de **servicios del dispositivo** se obtiene de sus distintas órdenes y actividades.
- Utilizar los valores reales de los enums existentes para recibido, diagnosticado, pendiente de aprobación, en reparación, pendiente de repuestos, listo para entrega, entregado y cancelado, según estén definidos.
- No inventar transiciones; comprobar que cada transición cumpla las reglas anteriores.
- Cuando el trabajo técnico esté verificado, pasar a `listo_para_entrega`; desde ahí recepción se encarga de finalizar el proceso.

## 12. Trabajo estrictamente módulo por módulo

**Regla central: una solicitud = un módulo o una funcionalidad claramente delimitada.**

1. **Antes de escribir código:** identificar el módulo solicitado, revisar su implementación actual y las dependencias inmediatas. Explicar brevemente qué se hará y qué archivos se tocarán. Si el usuario pidió implementar directamente, continuar sin solicitar aprobación para cambios ordinarios ya autorizados.
2. **Implementar solo ese módulo** de extremo a extremo cuando sea posible (datos existentes, validación, lógica de servidor, UI y permisos), sin iniciar el siguiente.
3. **Reutilizar antes de crear:** comprobar si el formulario, consulta, acción, componente o cálculo ya existe. Corregir/completar lo existente, evitando copias y reimplementaciones.
4. **Una sola pasada de implementación:** no hacer sucesivos refactors cosméticos, reorganizaciones o cambios no pedidos. No crear archivos vacíos, placeholders innecesarios ni funcionalidades de anticipación.
5. **Una única verificación al final:** ejecutar **una sola vez `npm run lint`** si el script existe; si no existe, ejecutar **una sola vez `npx tsc --noEmit`** como alternativa. No ejecutar ambas. No repetir el comando automáticamente si falla: informar el fallo y resolverlo solo cuando el usuario indique continuar.
6. **Sin pruebas por ahora:** no crear ni ejecutar pruebas unitarias, de integración o E2E; no incorporar frameworks de testing; no hacer pruebas manuales sistemáticas ni ejecutar `npm run build` como verificación adicional. El usuario decidirá cuándo iniciar la fase de pruebas.
7. **Cierre del módulo:** informar brevemente archivos cambiados, funcionalidad terminada, resultado de la verificación única y pendientes reales. **Detenerse y esperar** la siguiente instrucción; no comenzar otro módulo automáticamente.

Una verificación única **no** sustituye las validaciones de seguridad y reglas de negocio que deben implementarse en el código. La ejecución obligatoria de pasos de generación/migración autorizados no cuenta como segunda prueba, pero tampoco permite ejecutar comprobaciones repetidas.

## 13. Prohibiciones y cambios que necesitan autorización

No realizar por iniciativa propia:
- Crear/eliminar entidades o cambiar relaciones del contrato.
- Ejecutar migraciones, `db update`, borrados, reseteos o cambios destructivos sin aprobación.
- Instalar dependencias o cambiar framework, enrutado o arquitectura global.
- Agregar rol almacén, login de clientes, historial de estados o técnico por actividad.
- Implementar pagos parciales, facturación, proveedores o módulos ERP fuera de alcance.
- Modificar estilos globales, layouts o componentes compartidos sin que sea necesario para la tarea.
- Tocar secretos, credenciales, `.env` o configuración de producción sin autorización.
- Ejecutar operaciones destructivas de Git o desplegar a producción.
- Crear pruebas, lanzar builds repetidos o revisar el proyecto entero tras cada cambio pequeño.

Si hay una decisión de dominio sin definir o un conflicto que impide implementar correctamente, explicar la alternativa mínima y pedir decisión **solo sobre ese punto**; no inventar una nueva regla.

## 14. Formato de respuesta del agente

Responder siempre en español, con claridad y sin textos repetitivos.

**Antes de implementar:**
- Módulo y objetivo.
- Archivos previstos.
- Regla de negocio importante que afecta el cambio.

**Al terminar:**
- Qué se implementó (breve).
- Archivos modificados.
- Única verificación: comando, aprobado/fallido/no disponible.
- Pendientes o bloqueos, si existen.
- No continuar con otro módulo.

No afirmar que una funcionalidad fue probada si solo se ejecutó lint o una revisión de tipos. No reportar éxito si la verificación falló.
