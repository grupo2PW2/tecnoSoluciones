"use client";

import { Button } from "@/components/ui/button";

export function PrintTicketButton() {
  return (
    <Button type="button" onClick={() => window.print()}>
      Imprimir ticket
    </Button>
  );
}