# Tecno Soluciones

Sistema web para gestionar la recepción, el diagnóstico, la reparación y la entrega de equipos electrónicos. El personal administra clientes, equipos, presupuestos y repuestos. El cliente consulta su orden desde el portal público con el código o el QR del ticket. Los importes se muestran en bolivianos (Bs).

## Qué permite hacer

| Rol | Funciones principales |
| --- | --- |
| Administración | Realiza operaciones de Recepción, administra usuarios y servicios, configura el porcentaje global de ganancia y consulta reportes. |
| Recepción | Registra clientes, equipos y órdenes, asigna técnicos, imprime tickets, cotiza servicios directos y registra cobros y entregas. Gestiona repuestos, existencias y movimientos. |
| Técnico | Toma órdenes dentro de sus tres cupos, realiza diagnósticos, prepara presupuestos, registra repuestos utilizados y verifica el trabajo antes de marcarlo como listo. |
| Gerencia | Consulta órdenes, indicadores y reportes de reparaciones y consumo de repuestos. |
| Cliente | Consulta el avance y responde a una oferta vigente desde el portal público. |

En los servicios directos, Recepción registra la aceptación del cliente en tienda al cotizar. En los ingresos con diagnóstico, el cliente puede responder a la oferta desde el portal o en tienda. El inventario almacena cantidades en unidades y muestra su equivalente en cajas y unidades sueltas según la presentación de cada repuesto.

## Tecnologías y requisitos

- Next.js, React y TypeScript para la aplicación. Tailwind CSS, shadcn/ui y Recharts para la interfaz y los gráficos.
- PostgreSQL y Prisma ORM 8 RC para la persistencia y las migraciones.
- Vercel Blob privado para las imágenes de dispositivos, repuestos y usuarios.
- Vitest para pruebas unitarias y de integración.

## Instalación desde GitHub en una PC nueva

Esta guía usa Windows, PowerShell y una base PostgreSQL local para iniciar el sistema con datos de prueba.

### 1. Instala las herramientas

- Instala Git con Git Credential Manager para poder iniciar sesión en GitHub desde el navegador cuando Git lo solicite. [Git para Windows](https://git-scm.com/install/windows)
- Instala **Node.js 24.11 o posterior dentro de la rama 24** con el instalador de Windows, que incluye npm. [Descargas de Node.js](https://nodejs.org/en/download)
- Instala PostgreSQL 18 con **PostgreSQL Server** y **pgAdmin 4**. Guarda la contraseña que configures para el usuario `postgres`. Puedes usar el puerto predeterminado `5432`. Si también ejecutarás las pruebas de integración, instala **Command Line Tools** para disponer de `psql`. [Instalador de PostgreSQL para Windows](https://www.postgresql.org/download/windows/)

Abre una nueva ventana de PowerShell y confirma que reconoce los comandos.

```powershell
git --version
node --version
npm --version
```

Si PowerShell bloquea `npm.ps1` o `npx.ps1`, usa `npm.cmd` y `npx.cmd` en los comandos de esta guía.

### 2. Clona el repositorio e instala las dependencias

En PowerShell, ve a la carpeta donde quieres guardar el proyecto y ejecuta estos comandos. Si GitHub pide autenticación, continúa en el navegador con una cuenta que tenga acceso al repositorio. [Repositorio en GitHub](https://github.com/grupo2PW2/tecnoSoluciones) · [Autenticación de Git en Windows](https://docs.github.com/en/get-started/git-basics/caching-your-github-credentials-in-git?platform=windows)

```powershell
git clone https://github.com/grupo2PW2/tecnoSoluciones.git
cd tecnoSoluciones
npm ci
```

### 3. Crea la base de datos local

1. Abre **pgAdmin 4** y conéctate al servidor local de PostgreSQL como `postgres` con la contraseña del instalador. Si el servidor todavía no aparece en pgAdmin, regístralo con host `localhost`, puerto `5432`, base de mantenimiento `postgres` y usuario `postgres`.
2. En el árbol de pgAdmin, haz clic derecho en **Databases → Create → Database**. Escribe `tecno_soluciones`, selecciona `postgres` como propietario y guarda. [Creación de bases en pgAdmin](https://www.pgadmin.org/docs/pgadmin4/latest/database_dialog.html)

### 4. Configura el entorno

Dentro de la carpeta clonada, crea un archivo llamado `.env` junto a `package.json`. Cambia `TU_CLAVE` por la contraseña de PostgreSQL. Si tu contraseña contiene caracteres especiales de una URL, como `@` o `#`, codifícalos como `%40` o `%23`. Si elegiste otro puerto, cámbialo también.

```dotenv
DATABASE_URL="postgresql://postgres:TU_CLAVE@localhost:5432/tecno_soluciones"
SESSION_SECRET="PEGA_AQUI_EL_SECRETO_GENERADO"
URL_PUBLICA_SEGUIMIENTO="http://localhost:3000"
```

Genera un secreto y reemplaza `PEGA_AQUI_EL_SECRETO_GENERADO` con el resultado.

```powershell
node -p "require('node:crypto').randomBytes(32).toString('hex')"
```

Si quieres subir imágenes, añade `BLOB_READ_WRITE_TOKEN` con el token de un almacén privado de Vercel Blob. Puedes completar la primera prueba con registros sin imágenes adjuntas. Guarda las credenciales en `.env`, que Git ignora.

### 5. Prepara los datos e inicia la aplicación

Ejecuta cada comando desde la carpeta clonada. Continúa cuando termine el anterior correctamente.

```powershell
npx prisma db migrate
npm run db:seed
npm run dev
```

Las migraciones crean las tablas. El seed registra las cuentas de prueba y el servicio **Diagnóstico general**. Deja la terminal abierta mientras usas la aplicación.

### 6. Comprueba que funciona

1. Abre el [portal público](http://localhost:3000) y comprueba que aparece el campo para ingresar el código de seguimiento.
2. Entra al [inicio de sesión del personal](http://localhost:3000/login) con el usuario `recepcion` y la contraseña local de prueba `password`. Debe abrirse el panel de Recepción.
3. En **Órdenes de servicio**, registra una orden de prueba con un cliente y un equipo nuevos. Cuando se muestre el ticket, copia su código público.
4. Abre el portal público en una ventana privada, pega el código y comprueba que se muestra el equipo con el estado **Recibido**.

### Datos de prueba

`npm run db:seed` es para desarrollo y crea las cuentas que falten. También inicializa **Diagnóstico general** a Bs 50 si el servicio todavía no existe.

| Rol | Usuario local |
| --- | --- |
| Administración | `admin` |
| Recepción | `recepcion` |
| Técnico | `tecnico` |
| Gerencia | `gerente` |

Las cuentas de ejemplo usan la contraseña definida en el [seed de desarrollo](src/prisma/seed.ts).

### Probar el QR desde otro dispositivo

En `.env.local`, configura `URL_PUBLICA_SEGUIMIENTO` con la IPv4 de la PC en la red local, por ejemplo `http://192.168.1.42:3000`. Inicia el servidor con `npm run dev -- --hostname 0.0.0.0` y comprueba que esa dirección abre desde un dispositivo en la misma red. Vuelve a abrir o reimprimir el ticket para que su QR use la dirección configurada.

## Pruebas y compilación

```powershell
npm run lint
npm run test:unit
npm run build
```

Si la compilación termina correctamente, `npm run start` permite probar la versión de producción en local.

Para integración, crea `.env.test.local` en la raíz con una conexión a PostgreSQL de pruebas. También puedes definir `TEST_DATABASE_URL` en la terminal.

```dotenv
TEST_DATABASE_URL="postgresql://usuario:clave@localhost:5432/postgres"
```

El usuario de PostgreSQL debe tener permiso para crear bases. El comando crea una base temporal, aplica las migraciones, ejecuta la suite y elimina esa base al terminar.

```powershell
npm run test:integration
```

## Migraciones

El esquema se define en [`src/prisma/contract.prisma`](src/prisma/contract.prisma) y el historial está en [`migrations/`](migrations/). Para revisar qué se aplicaría a la base configurada, usa `npx prisma db migrate --show`.

Al realizar un cambio de esquema en desarrollo, modifica el contrato, emítelo, genera el plan de migración y revísalo antes de aplicarlo.

```powershell
npm run contract:emit
npx prisma migration plan --name nombre_del_cambio
npx prisma db migrate --show
npx prisma db migrate --advance-ref db
```

## Despliegue en Vercel

1. Importa el repositorio en Vercel como proyecto Next.js y selecciona Node.js 24.x.
2. En el entorno de producción del proyecto, configura `DATABASE_URL`, `SESSION_SECRET` y `URL_PUBLICA_SEGUIMIENTO`. Usa el dominio público con `https://` para que el QR abra el portal. Añade `BLOB_READ_WRITE_TOKEN` si habilitas imágenes. [Variables de entorno de Vercel](https://vercel.com/docs/environment-variables)
3. Antes de habilitar el acceso, carga en tu terminal `DATABASE_URL` con la conexión de producción. Si usas Neon, para migrar copia la **URL directa** desde **Connect** con **Connection pooling** desactivado. Si aparece `unsupported startup parameter: lc_monetary` en la aplicación, usa esa URL directa en Vercel y vuelve a desplegar. [Conexiones de Neon](https://neon.com/docs/connect/connection-errors#unsupported-startup-parameter)
4. Revisa las migraciones y, cuando confirmes el destino y el plan, aplícalas. [Comando de migración de Prisma](https://www.prisma.io/docs/cli/db-migrate)

   ```powershell
   npx prisma db migrate --show --db "$env:DATABASE_URL"
   npx prisma db migrate --db "$env:DATABASE_URL"
   ```

5. Para una base de producción nueva, queda pendiente el alta del primer administrador con credenciales propias. `npm run db:seed` está reservado para las cuentas de prueba. Una vez creado el administrador, puedes registrar al resto del personal desde **Usuarios**.

## Estructura del repositorio

| Ruta | Contenido |
| --- | --- |
| [`app/`](app/) | Portal público, inicio de sesión, páginas del panel y rutas de API. |
| [`features/`](features/) | Módulos de negocio, componentes y pruebas. |
| [`components/`](components/) | Componentes de interfaz compartidos. |
| [`src/prisma/`](src/prisma/) y [`migrations/`](migrations/) | Contrato de datos, conexión, seed de pruebas e historial de migraciones. |
| [`tests/integracion/`](tests/integracion/) | Preparación de PostgreSQL temporal y del entorno de prueba. |
