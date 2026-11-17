import "server-only";

const sessionCookieName = "tecno_session";
const sessionDurationSeconds = 60 * 60 * 8;

type SessionPayload = {
  userId: number;
  role: string;
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }

  return secret;
}

function encode(value: string) {
  return btoa(value).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  return atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "="));
}

function decodeSignature(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(
    atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=")),
    (character) => character.charCodeAt(0),
  );
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );

  return encode(String.fromCharCode(...new Uint8Array(signature)));
}

export async function createSession(userId: number, role: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + sessionDurationSeconds;
  const payload = encode(JSON.stringify({ userId, role, expiresAt } satisfies SessionPayload));
  const signature = await sign(payload);

  return {
    name: sessionCookieName,
    value: `${payload}.${signature}`,
    expiresAt: new Date(expiresAt * 1000),
  };
}

export async function verifySession(value: string | undefined) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature || !(await verifySignature(payload, signature))) {
    return null;
  }

  try {
    const session = JSON.parse(decode(payload)) as SessionPayload;

    if (
      !Number.isInteger(session.userId) ||
      typeof session.role !== "string" ||
      session.expiresAt <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

async function verifySignature(value: string, signature: string) {
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(getSessionSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"],
    );

    return await crypto.subtle.verify(
      "HMAC",
      key,
      decodeSignature(signature),
      new TextEncoder().encode(value),
    );
  } catch {
    return false;
  }
}

export { sessionCookieName, sessionDurationSeconds };