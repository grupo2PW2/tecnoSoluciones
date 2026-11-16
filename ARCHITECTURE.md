# Convenciones de arquitectura

## 1. Alcance

Este documento define las convenciones para organizar, extender y mantener Tecno Soluciones. La arquitectura actual es una aplicacion web Next.js con App Router, React, TypeScript y Prisma ORM para PostgreSQL.

Las nuevas funcionalidades deben seguir estas reglas salvo que exista una razon tecnica documentada para apartarse de ellas.

## 2. Principios

- Mantener cada responsabilidad en el nivel que le corresponde: rutas para composicion de paginas, componentes para UI reutilizable y `src/prisma/` para persistencia.
- Preferir componentes pequenos y composables antes que paginas monoliticas.
- Reutilizar los componentes de `components/ui/` antes de crear controles visuales nuevos.
- Mantener el dominio y los nombres del negocio en espanol, respetando los nombres existentes del contrato de datos.
- Evitar duplicar reglas de negocio entre paginas, componentes y acceso a datos.
- Mantener los cambios acotados al dominio funcional que se esta modificando.

## 3. Estructura de carpetas

```text
app/
  (auth)/                 Rutas y layout de autenticacion
  (dashboard)/            Rutas protegidas del panel operativo
    dashboard/            Resumen principal
    clientes/             Gestion de clientes
    diagnosticos/         Gestion de diagnosticos
    dispositivos/         Gestion de dispositivos
    inventario/           Gestion de inventario
    movimientos/          Gestion de movimientos
    ordenes/              Gestion de ordenes de servicio
    repuestos/            Gestion de repuestos
    servicios/            Gestion de servicios
    usuarios/             Gestion de usuarios
  (publico)/              Rutas publicas
    orden/[codigo]/       Consulta publica de una orden por codigo
components/               Componentes compartidos de aplicacion
components/ui/            Primitivas visuales reutilizables
hooks/                    Hooks compartidos de React
lib/                      Utilidades generales y funciones sin dominio
src/prisma/               Contrato, cliente y artefactos generados de Prisma
migrations/               Historial de migraciones y snapshots
public/                   Recursos estaticos
```

No se deben crear carpetas de rutas con nombres de grupos entre parentesis como parte de la URL. Los grupos `(auth)`, `(dashboard)` y `(publico)` sirven para compartir layouts sin modificar la ruta publica.

## 4. Convenciones de Next.js y rutas

- Usar el App Router. Las paginas se definen en `page.tsx` y los layouts compartidos en `layout.tsx`.
- Cada segmento de negocio debe tener su propia carpeta dentro del grupo de rutas correspondiente.
- Mantener los layouts de grupo enfocados en composicion global. El layout del panel integra `SiteHeader`, `AppSidebar` y el contenedor principal.
- Las paginas publicas no deben depender de la navegacion visual del dashboard.
- Usar segmentos dinamicos, como `[codigo]`, cuando el identificador forme parte de la URL publica.
- Definir metadatos globales o por pagina mediante las APIs de Next.js cuando el contenido lo requiera.
- Preferir Server Components por defecto. Agregar `"use client"` solo cuando se necesite estado, efectos, eventos del navegador o una API exclusiva del cliente.
- Mantener la logica de acceso a datos fuera de los componentes cliente. Los componentes cliente reciben datos y callbacks mediante props o usan una frontera de servidor definida por la aplicacion.

## 5. Componentes y UI

- Los componentes compartidos de aplicacion se ubican directamente en `components/` y usan nombres PascalCase, por ejemplo `AppSidebar` o `SiteHeader`.
- Las primitivas reutilizables de la biblioteca visual se ubican en `components/ui/` y deben ser genericas, sin reglas especificas de un modulo de negocio.
- Las variantes visuales deben centralizarse en el componente correspondiente. Para variantes de clases se usa `class-variance-authority` y para combinar clases se usa `cn`.
- Usar los componentes existentes de botones, campos, tarjetas, dialogos, sidebar y tooltip antes de introducir markup equivalente.
- Los iconos deben provenir de `lucide-react` cuando exista un icono adecuado.
- Los estilos globales se mantienen en `app/globals.css`. Los estilos particulares deben resolverse primero con las clases y tokens existentes.
- Mantener una interfaz consistente con el sistema visual existente: tipografia Titillium Web, tokens de color y componentes UI compartidos.

## 6. TypeScript e imports

- El codigo debe ser TypeScript estricto. No introducir `any` salvo una integracion externa que lo exija y que este justificada.
- Usar el alias `@/` para imports internos desde la raiz del proyecto, por ejemplo `@/components/ui/button`.
- Preferir imports con nombre cuando el modulo exponga varios elementos.
- Usar `import type` para tipos que no deben generar codigo en tiempo de ejecucion.
- Evitar rutas relativas largas entre carpetas de la aplicacion.
- Mantener nombres de variables y funciones descriptivos; no usar nombres de una sola letra fuera de callbacks triviales.

## 7. Datos y persistencia

- `src/prisma/contract.prisma` es la fuente editable del modelo de datos.
- `src/prisma/contract.json` y `src/prisma/contract.d.ts` son artefactos generados: no editarlos manualmente.
- `src/prisma/db.ts` es el punto central para crear el contrato y la conexion a la base de datos mediante `DATABASE_URL`.
- El acceso a PostgreSQL debe realizarse mediante el cliente configurado en `src/prisma/db.ts`; no crear conexiones paralelas desde paginas o componentes.
- Los nombres de entidades y estados deben conservar consistencia con el contrato existente. Las relaciones nuevas deben declarar sus campos y referencias de forma explicita.
- Los campos monetarios deben seguir el tipo y precision definidos por el contrato (`NumericString(10, 2)`).
- Los estados del dominio deben representarse con enums del contrato, no con strings libres.
- Los identificadores unicos, valores por defecto, relaciones y campos opcionales deben declararse en el contrato antes de usarse en la interfaz.

## 8. Cambios de esquema y migraciones

Para modificar la base de datos se debe seguir este orden:

1. Editar `src/prisma/contract.prisma`.
2. Regenerar el contrato con `npx prisma contract emit` o `npm run contract:emit`.
3. Crear el plan de migracion con `npx prisma migration plan --name <nombre>`.
4. Aplicar la migracion con `npx prisma db migrate --advance-ref db`.
5. Revisar los archivos generados en `migrations/` y verificar que el codigo compile.

No eliminar ni modificar migraciones historicas para corregir un cambio nuevo. Los cambios posteriores deben registrarse como nuevas migraciones.

## 9. Nombres

- Componentes React: PascalCase (`LoginForm`, `SiteHeader`).
- Funciones, hooks y variables: camelCase (`useMobile`, `fechaIngreso`).
- Hooks: deben comenzar con `use` y ubicarse en `hooks/` cuando sean compartidos.
- Archivos de paginas y layouts: conservar los nombres requeridos por Next.js (`page.tsx`, `layout.tsx`).
- Carpetas de rutas: minusculas y nombres en espanol, como `clientes`, `ordenes` y `repuestos`.
- Modelos, enums y campos de persistencia: respetar el estilo y los nombres ya definidos en `contract.prisma`.
- Tipos y contratos de TypeScript: PascalCase cuando sean declarados como tipos o interfaces.

## 10. Calidad y validacion

Antes de considerar terminado un cambio:

- Ejecutar `npm run lint`.
- Ejecutar `npm run build` cuando el cambio afecte rutas, layouts, configuracion de Next.js o integraciones de datos.
- Si se modifica el modelo, ejecutar tambien el flujo de contrato y migracion descrito arriba.
- Revisar que no existan imports sin usar, errores de TypeScript ni referencias a artefactos generados editados manualmente.
- Probar al menos la ruta funcional que se modifico en el entorno local.

Actualmente no existe una carpeta de pruebas automatizadas en la estructura del proyecto. Las nuevas funcionalidades con logica de negocio relevante deben incorporar pruebas cuando se establezca el framework de testing del proyecto.

## 11. Variables de entorno y seguridad

- Las credenciales y URLs de infraestructura se obtienen mediante variables de entorno, especialmente `DATABASE_URL`.
- No subir archivos `.env` ni secretos al repositorio.
- No exponer credenciales ni consultas de servidor en componentes cliente.
- Validar permisos y datos de entrada en la frontera de servidor antes de persistir cambios.
- No almacenar contrasenas en texto plano cuando se implemente o complete el flujo de autenticacion.

## 12. Flujo recomendado para una nueva funcionalidad

1. Identificar el dominio y la superficie de ruta correspondiente.
2. Revisar los componentes UI existentes y reutilizarlos.
3. Definir o actualizar el modelo en `contract.prisma` si la funcionalidad necesita datos nuevos.
4. Implementar la pagina y su composicion en el grupo de rutas correcto.
5. Extraer a `components/`, `hooks/` o `lib/` solo la logica que sea reutilizable o que mejore claramente la separacion de responsabilidades.
6. Regenerar y migrar el contrato si hubo cambios de esquema.
7. Ejecutar lint, build cuando corresponda y una verificacion manual de la ruta.
