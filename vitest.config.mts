import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const ruta = (relativa: string) => fileURLToPath(new URL(relativa, import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "@": ruta("./") },
  },
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          environment: "node",
          include: ["features/**/*.unit.test.ts"],
        },
      },
      {
        extends: true,
        resolve: {
          alias: { "server-only": ruta("./tests/integracion/server-only.ts") },
        },
        test: {
          name: "integration",
          environment: "node",
          include: ["features/**/*.integration.test.ts"],
          globalSetup: ["./tests/integracion/postgres.ts"],
          setupFiles: ["./tests/integracion/entorno.ts"],
        },
      },
    ],
  },
});
