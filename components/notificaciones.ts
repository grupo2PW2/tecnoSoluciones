"use client";

import { toast } from "@/components/ui/toast";

export function notificarGuardado(titulo: string, descripcion?: string) {
  toast.add({ title: titulo, description: descripcion, type: "success" });
}

export function notificarInformacion(titulo: string) {
  toast.add({ title: titulo, type: "info" });
}
