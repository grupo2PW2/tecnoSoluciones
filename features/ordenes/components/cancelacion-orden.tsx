
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motivoImpedimentoCancelacion } from "../cancelacion";
import { ConfirmacionCancelacion } from "./confirmacion-cancelacion";

export function MotivoCancelacion({ motivo }: { motivo: string | null }) {
  return (
    <Card>
      <CardHeader><CardTitle>Motivo de cancelación</CardTitle></CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap break-words text-sm">{motivo ?? "Sin registrar"}</p>
      </CardContent>
    </Card>
  );
}

export async function CancelacionOrden({ orden, puedeCancelar }: {
  orden: Parameters<typeof motivoImpedimentoCancelacion>[0] & {
    codigo: string;
    motivoCancelacion: string | null;
  };
  puedeCancelar: boolean;
}) {
  if (orden.estado === "CANCELADO") return <MotivoCancelacion motivo={orden.motivoCancelacion} />;
  if (!puedeCancelar || ["LISTO", "ENTREGADO", "RECHAZADO", "RECHAZADO_ENTREGADO"].includes(orden.estado)) return null;

  const impedimento = await motivoImpedimentoCancelacion(orden);

  return (
    <Card>
      <CardHeader><CardTitle>Cancelación</CardTitle></CardHeader>
      <CardContent>
        {impedimento ? <p className="text-sm text-muted-foreground">{impedimento}</p>
          : <ConfirmacionCancelacion ordenId={orden.id} codigo={orden.codigo} aprobada={orden.estado === "APROBADO"} />}
      </CardContent>
    </Card>
  );
}
