"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PublicOrderLookup() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedCode = code.trim();

    if (!normalizedCode) {
      setError("Ingresa el código privado de tu ticket.");
      return;
    }

    router.push(`/orden/${encodeURIComponent(normalizedCode)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="codigoCliente">Código privado</Label>
        <Input
          id="codigoCliente"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
            setError("");
          }}
          placeholder="Ej. 550e8400-e29b-41d4-a716-446655440000"
          autoComplete="off"
          required
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" aria-live="polite">
          {error}
        </p>
      ) : null}
      <Button type="submit">Consultar orden</Button>
    </form>
  );
}
