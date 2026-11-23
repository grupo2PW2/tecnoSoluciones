This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## URL pública de los tickets

`URL_PUBLICA_SEGUIMIENTO` define el dominio que aparece en el ticket y al que apunta su QR. Usa una dirección completa con `http://` o `https://` y el puerto si corresponde.

- Para probar desde un celular en la misma red, define la variable en `.env.local` con la IP de la PC, por ejemplo `URL_PUBLICA_SEGUIMIENTO=http://192.168.1.42:3000`.
- En Vercel, define la variable en el entorno Production con el dominio público definitivo y realiza un nuevo despliegue.

Si falta la variable o su valor es inválido, el ticket usa la dirección desde la que el personal abrió la aplicación. Vuelve a abrir y reimprimir un ticket si necesitas actualizar su QR.

## Pruebas de Órdenes

Ejecuta las pruebas unitarias con `npm run test:unit`.

Para las pruebas de integración, usa una instancia PostgreSQL de pruebas con `psql` disponible y un usuario que pueda crear bases. Define `TEST_DATABASE_URL` en `.env.test.local` o en la terminal. Por ejemplo, `postgresql://usuario:clave@localhost:5432/postgres`.

`npm run test:integration` crea una base temporal, aplica las migraciones existentes, ejecuta las pruebas y elimina la base al terminar. El proceso de pruebas usa esa base para las consultas y las escrituras.

## Instalar para seeders
npm install -D tsx

## ejecutar seed
npm run db:seed

## Pasos de migracion prisma
- editar src/prisma/contract.prisma
npx prisma contract emit
npx prisma migration plan --name <name>
npx prisma db migrate --advance-ref db
