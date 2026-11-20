<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md · Tecno Soluciones

## Objetivo del proyecto

Tecno Soluciones gestiona la recepción, el diagnóstico, la reparación y la entrega de equipos electrónicos. También gestiona presupuestos, repuestos, movimientos de inventario y ventas directas de repuestos.

Prioriza que cada usuario pueda completar su trabajo de principio a fin y que la interfaz muestre qué está viendo, qué puede hacer y qué falta para avanzar. Usa español en la interfaz y muestra los importes en bolivianos (Bs).

## Forma de trabajo y aprobación por módulo

- Trabaja un solo módulo a la vez. Antes de empezar, indica qué módulo vas a trabajar, qué podrá hacer cada rol, qué pantallas o formularios cambiarán y cómo verificarás el resultado. Si todavía no hay un módulo autorizado, espera mi aprobación.
- Dentro del módulo autorizado, completa el flujo de principio a fin. Incluye interfaz, permisos, cálculos, validaciones y persistencia. Si el flujo necesita una función de otro módulo, reutiliza lo existente. Si necesitas ampliar ese otro módulo, explica por qué y pide permiso antes de hacerlo.
- Si hay varias formas de resolver una situación que afecta el flujo de usuario, los permisos, el esquema, el stock o los importes, explica brevemente cuál recomiendas, por qué y qué cambiaría. Pide permiso antes de aplicar esa decisión. Resuelve los detalles rutinarios dentro del alcance aprobado siguiendo las convenciones del proyecto.
- Antes de modificar un módulo, revisa sus rutas, componentes, consultas, acciones y modelos. Reutiliza la lógica existente que cumpla los requerimientos. Organiza la lógica y los componentes del módulo en `features/` según la estructura del repositorio. Usa `app/` para páginas, layouts y manejadores de rutas.
- Reutiliza los componentes shadcn/ui disponibles. Si necesitas agregar uno o instalar una dependencia, indica qué necesitas, para qué y qué comando ejecutarías. Espera mi permiso antes de ejecutarlo.
- Al terminar el módulo, resume qué quedó implementado, cómo lo verificaste y qué sigue pendiente. Detente y espera mi aprobación explícita antes de iniciar el siguiente módulo.

## Diseño e interacción

- Usa `Dialog` para formularios cortos y confirmaciones. Para formularios largos, como una orden o un presupuesto, usa un `Sheet` amplio que se abra desde la derecha. Divide el contenido en secciones, permite desplazarlo y mantén visibles las acciones de guardar y cancelar.
- Usa tablas cuando el usuario necesite comparar registros y tarjetas cuando le convenga identificar y actuar sobre cada elemento. Destaca la información que ayuda al rol a decidir. En órdenes, prioriza el código, el cliente, el equipo, el estado, el técnico y la fecha relevante.
- Distingue los estados con texto y color. Da mayor peso a la acción principal y agrupa las secundarias. Si una acción está bloqueada, muestra la razón cerca de ella.
- Actualiza búsquedas y filtros al escribir o al seleccionar una opción, sin pulsar «Buscar» ni recargar la página. Si la búsqueda consulta al servidor, aplica un breve retraso al escribir y evita que una respuesta anterior reemplace la más reciente. Si hay paginación, vuelve a la primera página al cambiar la búsqueda o los filtros.
- Incluye estados de carga, error, lista vacía y búsqueda sin resultados. Si falla el guardado, conserva los datos ingresados y muestra cómo corregir el error. Previene guardados duplicados.
- Usa etiquetas visibles en los formularios, navegación por teclado y foco claro al abrir y cerrar un modal o panel.

## Órdenes de servicio como centro de trabajo

La orden reúne la información y las acciones necesarias para atender un equipo. Los módulos de Clientes, Equipos e Inventario también permiten buscar y administrar sus propios registros.

### Recepción

- En «Nueva orden», permite buscar y seleccionar al cliente y su equipo. Si alguno no existe, permite crearlo desde el mismo flujo. Al guardar el cliente o equipo nuevo, selecciónalo y conserva los datos ya ingresados en la orden.
- Permite indicar si el ingreso requiere diagnóstico o corresponde a un servicio directo. Registra el motivo, la condición física del equipo y los accesorios recibidos.
- Al crear la orden, genera un código interno secuencial y un código de consulta único para el cliente. Muestra la vista previa del ticket con equipo, fecha de ingreso, dirección de seguimiento y código visible. Incluye un QR de acceso directo cuando esté disponible. Permite imprimir y reimprimir el ticket con el mismo código.
- Desde el detalle, permite consultar el avance y los presupuestos, cotizar un servicio directo, registrar la respuesta del cliente en tienda y completar el cobro y la entrega cuando corresponda.
- Recepción también puede gestionar repuestos, consultar stock y registrar entradas, salidas, ajustes y ventas directas desde Inventario.

### Técnico

- En «Disponibles», muestra órdenes sin técnico que pueda tomar. En «Mis órdenes», muestra sus trabajos y cuántos de sus tres cupos están ocupados.
- Desde la orden, permite iniciar el diagnóstico, registrar hallazgos, preparar presupuestos y adicionales, consultar repuestos compatibles y su stock, iniciar y finalizar servicios, registrar repuestos utilizados y verificar el trabajo.
- En el detalle técnico, prioriza el equipo, el problema reportado, el alcance aprobado, el estado de cada servicio y la siguiente acción permitida.
- Cuando el trabajo autorizado esté terminado y verificado, permite marcar la orden como lista para entrega.

### Administración, gerencia y cliente

- Administración puede realizar todas las operaciones de recepción, incluido inventario y ventas directas. También administra usuarios, roles, servicios y parámetros, y puede acceder a las consultas y reportes de gerencia. La ejecución y la verificación técnica corresponden al técnico.
- Gerencia tiene acceso de lectura a órdenes, historiales, carga por técnico y reportes. Los reportes deben permitir consultar órdenes por periodo y estado, trabajo por técnico, equipos con mayor frecuencia de reparación y repuestos utilizados.
- El cliente consulta el estado de su orden mediante el código o QR del ticket. Puede revisar el alcance, el importe y las fechas de una oferta vigente y registrar su respuesta. Muestra solo la información necesaria para el seguimiento y la decisión.
- Valida los permisos en el servidor en cada operación, además de ajustar las acciones visibles en la interfaz.

## Reglas de negocio

### Asignación, diagnóstico y cierre técnico

- Cada orden corresponde a un equipo de un cliente y comienza como `RECIBIDO`.
- Un técnico puede tomar hasta tres órdenes activas. Valida el cupo y que la orden siga sin asignar en la misma operación, incluso ante solicitudes simultáneas.
- La orden asignada ocupa cupo mientras `fechaCierreTecnico` esté vacía. Libera el cupo al pasar a `LISTO`, al registrar el rechazo de toda la reparación o al cancelar. El rechazo de un adicional conserva el cupo si queda trabajo autorizado por terminar.
- Solo permite cancelar si el técnico aún no realizó ningún trabajo. Esto incluye el diagnóstico. Si ya inició una intervención o registró un trabajo realizado, bloquea la cancelación y muestra el motivo. Si el cliente decide retirar el equipo después del diagnóstico, registra el rechazo de la reparación y la devolución.
- Guarda el estado, las fechas, las observaciones y la verificación de cada servicio en `PresupuestoServicio`. Evita introducir una tabla `Actividades`.
- Registra el diagnóstico general como una sola línea, aunque el técnico encuentre varias fallas. Puede iniciarse en un presupuesto en borrador y conservar su estado `FINALIZADO` cuando se presente la cotización de reparación.
- La aprobación autoriza los servicios de la versión correspondiente. El técnico marca cada servicio en proceso cuando empieza y lo finaliza y verifica después de probar el resultado. Al completar los trabajos autorizados, puede marcar la orden `LISTO`.

### Presupuestos, aprobación y versiones

- Antes de cotizar un trabajo que requiera repuestos, comprueba su compatibilidad y disponibilidad. Si falta una pieza, informa al cliente y deja fuera de la cotización el trabajo que depende de ella.
- Cada versión presentada conserva sus partidas, cantidades, precios, prioridad, recargo, descuento, total ofrecido, fecha estimada y fecha de vencimiento. La fecha estimada indica cuándo se espera tener listo el equipo y el vencimiento indica hasta cuándo se puede responder.
- Recepción puede registrar la aprobación o el rechazo en tienda. El cliente también puede responder por web. Registra la versión, la fecha y el canal de respuesta. Solo acepta una respuesta para una oferta pendiente y vigente.
- Una oferta que vence sin respuesta queda `VENCIDO`. Una oferta que el cliente rechaza expresamente queda `RECHAZADO`. Para retomar una oferta vencida, presenta otra versión con los precios y las fechas aplicables. El vencimiento por sí solo no genera un recargo.
- Si cambia el alcance antes de la primera aprobación, presenta una nueva versión principal y conserva la anterior para consulta. Si el cliente quiere aceptar solo parte de una propuesta, presenta una nueva versión con ese alcance.
- Después de aprobar el presupuesto principal, una versión adicional contiene únicamente el trabajo nuevo. Si el cliente la rechaza o vence, conserva el alcance ya autorizado. Si el trabajo adicional impide completar la reparación original, el técnico registra el motivo y recepción coordina con el cliente.

### Cobro, entrega y devolución

- Recepción registra un único cobro al entregar el equipo, sin adelantos. El total incluye lo aprobado que corresponda cobrar. Un adicional rechazado o vencido queda fuera y cada partida se cobra una sola vez.
- Si el cliente rechaza toda la reparación y ya se realizó el diagnóstico, se cobra únicamente el diagnóstico a su tarifa completa.
- Al entregar o devolver el equipo, registra la fecha, el usuario que realizó la entrega y el importe cobrado cuando corresponda. Una reparación entregada queda `ENTREGADO`. Una devolución tras un rechazo queda `RECHAZADO_ENTREGADO`. Para una devolución tras cancelación, conserva `CANCELADO` y registra los datos de entrega.

## Cálculos de inventario, movimientos y presupuestos

### Existencias en cajas y unidades

- Guarda el stock y las cantidades de los movimientos en unidades. Usa `Repuestos.unidadesCaja` para mostrar cajas completas y unidades sueltas. Por ejemplo, con 6 unidades por caja y 33 en stock, muestra «5 cajas y 3 unidades».
- Si `unidadesCaja` es cero o el repuesto no tiene presentación por caja, muestra el stock solo en unidades y permite registrar únicamente unidades para ese repuesto.
- En el formulario de movimiento, permite ingresar cajas y unidades por cada repuesto con presentación por caja. Muestra el resultado antes de guardar: `unidades totales = cajas × unidadesCaja + unidades sueltas`.
- Valida que las cajas y las unidades sean enteros no negativos y que el total por línea sea mayor que cero. Repite el cálculo y la validación en el servidor.

### Movimientos con varios repuestos

- Un movimiento puede contener varias líneas de detalle. Cada línea corresponde a un repuesto y registra su cantidad y, cuando corresponda, su costo o precio unitario. Permite agregar y quitar líneas antes de confirmar.
- El tipo de movimiento determina si las cantidades se suman o se restan. Las entradas y los ajustes positivos suman. Las salidas y los ajustes negativos restan. La cantidad de cada línea se registra en positivo.
- Guarda la cabecera y los detalles del movimiento y actualiza el stock de todos los repuestos afectados en una sola transacción. Si un repuesto aparece en varias líneas, valida su disponibilidad con la suma de esas líneas.
- Si alguna salida supera el stock disponible, rechaza el movimiento completo, identifica el repuesto que causó el error y conserva el formulario para corregirlo. Evita que las operaciones simultáneas dejen stock negativo.
- Después de guardar, actualiza existencias e historial en pantalla sin recargar la página. Si corresponde mostrar un importe del movimiento, calcúlalo a partir de las cantidades y los costos o precios unitarios de sus detalles, según el tipo.
- Cotizar y aprobar no reservan ni descuentan stock. Al aplicar un repuesto, registra una salida por reparación vinculada a la orden. Al entregar un repuesto vendido directamente, registra una salida de venta con su detalle. La venta directa puede existir sin una orden de reparación.
- Si necesitas cambiar cómo se calcula `costoActual` o `precioVenta`, explica la fórmula recomendada con un ejemplo y pide permiso antes de modificarla.

### Importes de presupuestos

- Calcula cada importe de línea como `cantidad × precioUnitario`. Suma por separado servicios y repuestos. Usa los precios guardados en la versión para reproducir lo ofrecido.
- Calcula el recargo sobre el importe de la reparación, incluidos mano de obra y repuestos. Aplica 0 % para prioridad baja, 5 % para media y 10 % para alta.
- Si el cliente aprueba la reparación después del diagnóstico general, aplica una sola vez el descuento del 50 % del precio de ese diagnóstico.
- Muestra subtotales, recargo, descuento y total en el editor. Recalcula y valida en el servidor. Usa aritmética decimal y guarda el total de la versión al presentarla, junto con sus precios y condiciones.
- Como referencia, con un diagnóstico de Bs 50, una reparación de Bs 400 y prioridad media, el recargo es Bs 20 y el descuento es Bs 25. El total aprobado es Bs 445 y se cobra al entregar el equipo.

## Verificación antes de dar un módulo por terminado

- Comprueba el recorrido completo desde el rol que lo ejecuta y verifica que las acciones restringidas también se bloqueen en el servidor.
- En Órdenes, prueba el ingreso con cliente y equipo existentes, la creación de ambos desde el mismo formulario, la impresión y reimpresión del ticket, y la toma de una orden con cupo disponible y con los tres cupos ocupados.
- En Inventario, prueba un movimiento con varios repuestos, la conversión de cajas a unidades y una salida que exceda el stock de una sola línea. Confirma que esa salida deja sin cambios todos los saldos.
- En Presupuestos, prueba la aprobación, el rechazo, el vencimiento y un adicional rechazado. Comprueba que el total de entrega conserve lo autorizado y aplique el descuento una sola vez.
- En los módulos que tengan búsquedas, filtros o formularios, comprueba que respondan sin recargar la página y que un error de guardado conserve lo ingresado.