import { inject } from "vitest";

const entorno = inject("postgresTemporal");
process.env.DATABASE_URL = entorno.url;
process.env.SESSION_SECRET = entorno.sessionSecret;
