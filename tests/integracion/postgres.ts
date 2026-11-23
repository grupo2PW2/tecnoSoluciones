import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    postgresTemporal: { url: string; sessionSecret: string };
  }
}

const ruta = (relativa: string) => fileURLToPath(new URL(relativa, import.meta.url));

export default function prepararPostgres(proyecto: TestProject) {
  config({ path: ruta("../../.env.test.local"), quiet: true });
  const conexion = process.env.TEST_DATABASE_URL;
  if (!conexion) {
    throw new Error("Configura TEST_DATABASE_URL para ejecutar las pruebas de integración.");
  }

  const base = new URL(conexion);
  if (base.protocol !== "postgresql:" && base.protocol !== "postgres:") {
    throw new Error("TEST_DATABASE_URL debe ser una URL de PostgreSQL.");
  }

  const nombre = "tecno_test_" + randomBytes(8).toString("hex");
  const temporal = new URL(base);
  temporal.pathname = "/" + nombre;
  const entornoPsql: NodeJS.ProcessEnv = {
    ...process.env,
    PGHOST: base.hostname.replace(/^\[|\]$/g, ""),
    PGPORT: base.port || "5432",
    PGUSER: decodeURIComponent(base.username),
    PGPASSWORD: decodeURIComponent(base.password),
    PGDATABASE: decodeURIComponent(base.pathname.slice(1)) || "postgres",
    PGSSLMODE: base.searchParams.get("sslmode") ?? process.env.PGSSLMODE,
    PGCONNECT_TIMEOUT: "10",
  };

  function ejecutarPsql(sql: string) {
    execFileSync("psql", ["--no-psqlrc", "--no-password", "--set=ON_ERROR_STOP=1", "--command", sql], {
      env: entornoPsql,
      stdio: "inherit",
    });
  }

  const eliminarTemporal = () => ejecutarPsql(`DROP DATABASE "${nombre}" WITH (FORCE)`);
  ejecutarPsql(`CREATE DATABASE "${nombre}"`);

  try {
    execFileSync(process.execPath, [ruta("../../node_modules/prisma/dist/prisma.js"), "db", "migrate"], {
      cwd: ruta("../../"),
      env: { ...process.env, DATABASE_URL: temporal.href },
      stdio: "inherit",
    });
    proyecto.provide("postgresTemporal", {
      url: temporal.href,
      sessionSecret: randomBytes(32).toString("hex"),
    });
  } catch (error) {
    eliminarTemporal();
    throw error;
  }

  return eliminarTemporal;
}
