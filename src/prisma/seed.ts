import "dotenv/config";

import { hashPassword } from "@/lib/password";
import { db } from "@/src/prisma/db";
import {
  nombreDiagnosticoGeneral,
  tarifaInicialDiagnostico,
} from "@/features/ordenes/diagnostico-general";

type Rol = "ADMINISTRADOR" | "TECNICO" | "RECEPCIONISTA" | "GERENTE";

interface UsuarioSeed {
  nombre: string;
  apellido: string;
  DNI: string;
  telefono: string;
  username: string;
  rol: Rol;
}

// Exclusivamente para pruebas locales
const PASSWORD_PRUEBA = "password";

const usuarios: UsuarioSeed[] = [
  {
    nombre: "Administrador",
    apellido: "Sistema",
    DNI: "TEST-001",
    telefono: "70000001",
    username: "admin",
    rol: "ADMINISTRADOR",
  },
  {
    nombre: "Pedro",
    apellido: "Vargas",
    DNI: "TEST-005",
    telefono: "70000005",
    username: "tecnico",
    rol: "TECNICO",
  },
  {
    nombre: "Maria",
    apellido: "Lopez",
    DNI: "TEST-006",
    telefono: "70000006",
    username: "recepcion",
    rol: "RECEPCIONISTA",
  },
  {
    nombre: "Roberto",
    apellido: "Gutierrez",
    DNI: "TEST-008",
    telefono: "70000008",
    username: "gerente",
    rol: "GERENTE",
  },
];

async function seed() {
  // Nunca ejecutar este seed en producción.
  if (process.env.NODE_ENV === "production") {
    throw new Error("No se permite ejecutar el seed de pruebas en producción.");
  }

  console.log("Iniciando seed de usuarios...");

  const passwordHash = await hashPassword(PASSWORD_PRUEBA);

  let creados = 0;
  let existentes = 0;

  for (const usuario of usuarios) {
    const existente = await db.orm.public.Usuarios.where({
      username: usuario.username,
    }).first();

    if (existente) {
      console.log(`Ya existe: ${usuario.username}`);
      existentes++;
      continue;
    }

    await db.orm.public.Usuarios.create({
      ...usuario,
      password: passwordHash,
      activo: true,
    });

    console.log(`Creado: ${usuario.username} (${usuario.rol})`);

    creados++;
  }

  await db.orm.public.Servicios.where({
    nombre: nombreDiagnosticoGeneral,
  }).upsert({
    create: {
      nombre: nombreDiagnosticoGeneral,
      precioReferencial: tarifaInicialDiagnostico,
    },
    update: { nombre: nombreDiagnosticoGeneral },
  });

  console.log("\nSeed finalizado");
  console.log(`Creados: ${creados}`);
  console.log(`Existentes: ${existentes}`);
}

seed()
  .catch((error: unknown) => {
    console.error("Error al ejecutar seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.close();
  });
