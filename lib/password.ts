const passwordIterations = 210_000;

function encodeBytes(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes));
}

function decodeBytes(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  return Uint8Array.from(
    atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=")),
    (character) => character.charCodeAt(0),
  );
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: passwordIterations,
      hash: "SHA-256",
    },
    key,
    256,
  );

  return `pbkdf2$${passwordIterations}$${encodeBytes(salt)}$${encodeBytes(
    new Uint8Array(derivedBits),
  )}`;
}

export async function verifyPassword(password: string, storedPassword: string) {
  const [algorithm, iterationsValue, encodedSalt, encodedHash] =
    storedPassword.split("$");
  const iterations = Number(iterationsValue);

  if (
    algorithm !== "pbkdf2" ||
    !Number.isSafeInteger(iterations) ||
    iterations < 100_000 ||
    !encodedSalt ||
    !encodedHash
  ) {
    return false;
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(password),
      "PBKDF2",
      false,
      ["deriveBits"],
    );
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: decodeBytes(encodedSalt),
        iterations,
        hash: "SHA-256",
      },
      key,
      256,
    );

    const derivedHash = new Uint8Array(derivedBits);
    const storedHash = decodeBytes(encodedHash);
    let difference = derivedHash.length ^ storedHash.length;

    for (let index = 0; index < derivedHash.length; index += 1) {
      difference |= derivedHash[index] ^ (storedHash[index] ?? 0);
    }

    return difference === 0;
  } catch {
    return false;
  }
}