# Tecno Soluciones · Flujo de trabajo por rol

El personal inicia sesión en `/login` y trabaja desde el panel **Inicio**. El cliente entra al portal público con el código de seguimiento o el QR de su ticket, sin crear una cuenta.

## Cómo avanza una orden

| Tipo de ingreso | Quién cotiza | Cómo se autoriza el trabajo |
| --- | --- | --- |
| **Requiere diagnóstico** | El técnico asignado finaliza el diagnóstico y presenta el presupuesto. | El cliente aprueba desde el portal. Si decide rechazarlo, puede hacerlo desde el portal o pedir a Recepción que registre el rechazo en tienda. |
| **Servicio directo** | Recepción o Administración prepara la cotización con los servicios y repuestos necesarios. | Recepción o Administración registra la aceptación verbal en tienda. |

Una orden aprobada pasa a **En reparación** cuando el técnico inicia el primer servicio. Tras finalizar y verificar todos los trabajos autorizados, el técnico la deja **Lista para entrega**. Recepción o Administración registra el cobro y la entrega.

## Recepción

### 1. Recibir el equipo y emitir el ticket

1. En **Inicio**, revisa las órdenes sin técnico, las ofertas vigentes y los equipos por entregar.
2. En **Órdenes de servicio → Nueva orden**, busca y selecciona al cliente y su equipo. Si alguno falta, regístralo desde el mismo formulario. También puedes administrar esos registros desde **Clientes** y **Dispositivos**.
3. Elige **Requiere diagnóstico** o **Servicio directo**. Registra el motivo del ingreso, la condición física y los accesorios recibidos.
4. Selecciona un técnico con cupo disponible o guarda la orden sin asignar. Después puedes usar **Asignar técnico** desde la bandeja. Una orden sin técnico también puede ser tomada desde la bandeja técnica.
5. Selecciona **Guardar orden**. La orden queda en estado **Recibido**. Entrega el ticket con el código público y el QR cuando esté disponible. Para reimprimirlo, abre **Ver ticket → Imprimir ticket** en la fila de la orden. El código de seguimiento se conserva.

### 2. Gestionar la cotización y la respuesta

- **Servicio directo.** Abre la orden y selecciona **Crear presupuesto**. Agrega los servicios y los repuestos necesarios, revisa las cantidades y el total, e indica la fecha estimada. Cuando el cliente acepte verbalmente el importe, usa **Registrar aceptación en tienda**. La orden queda **Aprobada** y el cobro se registra al entregar el equipo.
- **Requiere diagnóstico.** Consulta la oferta que presentó el técnico y orienta al cliente para que apruebe desde el portal. Si el cliente comunica su rechazo en tienda mientras la oferta está vigente, usa **Registrar rechazo**.
- **Oferta por corregir.** Si detectas un error en una oferta vigente sin respuesta, usa **Retirar oferta**. La orden sigue abierta y la versión queda en el historial. Para una orden con diagnóstico, el técnico asignado prepara y presenta la versión corregida.

### 3. Cobrar, entregar o devolver

| Estado de la orden | Qué debe hacer Recepción |
| --- | --- |
| **Lista para entrega** | Abre el detalle, revisa el total autorizado, cobra una sola vez y confirma la entrega. La orden pasa a **Entregada**. |
| **Rechazada** | Si se completó el diagnóstico, cobra su tarifa íntegra. Registra la devolución del equipo. La orden pasa a **Devuelto tras rechazo**. |
| **Cancelada** | Registra la devolución sin cobro. Se conserva el estado **Cancelado** y queda registrada la fecha de devolución. |

Si el cliente retira el equipo antes de que se inicie el diagnóstico o la reparación, puedes usar **Cancelar orden** e indicar el motivo cuando el estado lo permita. Si ya se realizó el diagnóstico y el cliente desiste de la reparación, utiliza el flujo de rechazo y devolución.

### 4. Gestionar repuestos, existencias y movimientos

1. En **Repuestos**, registra o edita las fichas. Define las unidades por caja cuando corresponda y revisa el estado comercial del repuesto.
2. En **Inventario**, consulta el saldo y usa **Editar mínimo** para configurar las alertas de reposición. Si el saldo llega al mínimo o baja de él, el sistema señala el repuesto. Un mínimo de cero deja el repuesto sin alerta. Puedes abrir el alta de repuestos desde esta pantalla.
3. En **Movimientos**, elige **Registrar entrada**, **Registrar salida** o **Nueva venta**. Agrega los productos del movimiento, una línea por repuesto, e indica cajas y unidades sueltas según corresponda. Por ejemplo, cuatro cajas de seis unidades y tres sueltas suman 27 unidades.
4. En una entrada, indica el costo total del lote de cada repuesto. En una salida, indica el motivo. En una venta directa, revisa el precio y confirma el cobro y la entrega. Si falta stock para alguna línea, el sistema rechaza todo el movimiento.

## Técnico

### 1. Tomar una orden e iniciar el trabajo

1. En **Inicio**, revisa tus pendientes y cuántos de tus tres cupos están ocupados.
2. En **Órdenes de servicio → Disponibles**, elige una orden sin técnico y confirma **Tomar orden**. Continúa desde **Mis órdenes**, donde también aparecen las asignadas por Recepción.
3. Abre el detalle y revisa el equipo, el problema reportado, la condición física y los accesorios. Si es un servicio directo, espera a que Recepción registre la aceptación. Cuando esté aprobado, pasa a la ejecución técnica.
4. Si requiere diagnóstico, usa **Iniciar diagnóstico**, registra los hallazgos y selecciona **Finalizar diagnóstico**. Registra todos los hallazgos en el mismo diagnóstico general de la orden.

### 2. Cotizar una reparación después del diagnóstico

1. Abre el presupuesto de la orden y agrega la mano de obra. Puedes elegir un servicio del catálogo o registrarlo desde **Nuevo servicio** en el editor.
2. Agrega los repuestos pertinentes y revisa sus existencias. El personal identifica la pieza adecuada. El sistema valida el saldo disponible al cotizar.
3. Revisa las cantidades, el desglose y el total. Indica la prioridad, la fecha estimada de entrega y el vencimiento. Guarda un borrador si necesitas continuar después o selecciona **Presentar presupuesto** para habilitar la respuesta del cliente.
4. Si la oferta vence, usa **Renovar presupuesto**. La orden sigue pendiente y conserva el cupo mientras no avance a un estado que cierre el trabajo técnico. La renovación toma las tarifas vigentes y conserva el importe del diagnóstico ya realizado.
5. Si la oferta vigente se retira antes de que el cliente responda, usa **Preparar nueva versión** para corregir las partidas y revisar las fechas antes de publicarla. Las versiones anteriores quedan en el historial. Después de la aprobación, el presupuesto principal queda cerrado a nuevas versiones.

El sistema aplica un recargo de 0 %, 5 % o 10 % sobre la reparación según la prioridad y descuenta el 50 % del diagnóstico una sola vez cuando se aprueba la reparación.

### 3. Ejecutar, verificar y dejar listo para entrega

1. Cuando la orden esté **Aprobada**, abre los trabajos autorizados y usa **Iniciar servicio** en la partida que vayas a ejecutar. Al iniciar el primer servicio, la orden pasa a **En reparación**.
2. Si usas piezas, entra a **Registrar repuestos utilizados** e indica las cantidades. El sistema registra la salida por reparación vinculada a la orden y descuenta las unidades en ese momento. La cotización y la aprobación mantienen el saldo disponible.
3. Prueba el resultado, registra las observaciones y usa **Verificar y finalizar** en cada servicio.
4. Cuando todos los trabajos autorizados estén finalizados y verificados, selecciona **Dejar lista para entrega** y confirma el cierre técnico. Se libera tu cupo y Recepción continúa con el cobro y la entrega. El cupo también se libera al rechazarse toda la reparación o al cancelarse la orden.

## Administración

1. En **Inicio**, consulta las órdenes activas, las listas para entrega, los repuestos para reponer, los cobros y las ventas directas. Para atender una orden o registrar movimientos, sigue el flujo de Recepción. La ejecución y verificación de los servicios las registra el técnico asignado.
2. En **Usuarios**, crea las cuentas del personal con **Nuevo usuario**. Desde **Gestionar acceso**, puedes cambiar el rol o el estado de una cuenta cuando corresponda. Una cuenta de Administración conserva su rol. El acceso de un técnico con órdenes pendientes de cierre técnico queda protegido frente a cambios de rol o desactivación.
3. En **Servicios**, registra o edita el catálogo y las tarifas de referencia en Bs. El técnico también puede dar de alta un servicio desde su cotización.
4. En **Configuración**, cambia el porcentaje global de ganancia cuando corresponda. Al guardarlo se recalculan los precios de venta del catálogo con el costo de referencia de cada repuesto. Las ofertas presentadas y los movimientos ya registrados conservan sus importes.
5. En **Reportes**, consulta el mismo conjunto de indicadores operativos disponible para Gerencia.

## Gerencia

1. Abre **Inicio** para revisar las órdenes registradas, las pendientes de asignación y las listas para entrega.
2. En **Órdenes de servicio**, busca la orden o filtra por estado. Abre el detalle para consultar el equipo, el técnico, el avance, los presupuestos disponibles y la información de entrega. El acceso es de lectura.
3. En **Reportes**, ajusta **Desde** y **Hasta**. Filtra por estado la tabla **Órdenes ingresadas en el periodo** y revisa **Trabajo por técnico**, **Equipos más reparados** y **Repuestos utilizados**.

Las órdenes ingresadas se agrupan por su fecha de ingreso. Las reparaciones se contabilizan por el cierre técnico y el consumo de repuestos por la fecha de la salida vinculada a la orden.

## Cliente

1. Escanea el QR del ticket o abre la página pública, escribe el código de seguimiento y consulta la orden.
2. Revisa el equipo, el estado y la barra de avance. Si hay una oferta vigente, consulta los servicios, repuestos, total, fecha estimada de entrega y vencimiento.
3. Para una orden con diagnóstico, selecciona **Aprobar presupuesto** o **Rechazar presupuesto** y confirma. Cada versión vigente admite una sola respuesta. Si ves que la oferta venció o fue retirada, consulta el mismo código cuando se publique una versión nueva.
4. Vuelve al portal con el mismo código para revisar el avance. Si la orden es de servicio directo, la aceptación se registra en tienda y el portal sirve para consultar el estado.
