import "dotenv/config";

import { hashPassword } from "@/lib/password";
import { db } from "@/src/prisma/db";

const seedUsername = process.env.SEED_ADMIN_USERNAME?.trim();
const seedPassword = process.env.SEED_ADMIN_PASSWORD;
const seedDni = process.env.SEED_ADMIN_DNI?.trim();
const seedName = process.env.SEED_ADMIN_NAME?.trim();

function requireSeedValue(value: string | undefined, variableName: string) {
	if (!value) {
		throw new Error(`Falta la variable de entorno ${variableName}.`);
	}

	return value;
}

async function seed() {
	const username = requireSeedValue(seedUsername, "SEED_ADMIN_USERNAME");
	const password = requireSeedValue(seedPassword, "SEED_ADMIN_PASSWORD");
	const DNI = requireSeedValue(seedDni, "SEED_ADMIN_DNI");
	const nombre = requireSeedValue(seedName, "SEED_ADMIN_NAME");

	if (password.length < 8) {
		throw new Error("SEED_ADMIN_PASSWORD debe tener al menos 8 caracteres.");
	}

	const existingUser = await db.orm.public.Usuarios.where({ username }).first();

	if (existingUser) {
		await db.orm.public.Usuarios.where({ id: existingUser.id }).update({
			nombre,
			DNI,
			activo: true,
			rol: "ADMINISTRADOR",
		});
		console.log(`Usuario administrador actualizado: ${username}`);
		return;
	}

	await db.orm.public.Usuarios.create({
		nombre,
		DNI,
		username,
		password: await hashPassword(password),
		activo: true,
		rol: "ADMINISTRADOR",
	});
	console.log(`Usuario administrador creado: ${username}`);
}

seed()
	.catch((error: unknown) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.close();
	});
