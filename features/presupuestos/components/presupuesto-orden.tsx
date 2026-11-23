
import { Card, CardContent } from "@/components/ui/card";
import { obtenerHistorialPresupuestos, obtenerPresupuestoOrden } from "../consultas";
import { fechaBolivia } from "../fechas";
import { listarRepuestosCotizables } from "../repuestos";
import { listarServiciosCotizables } from "../servicio";
import { IniciarPresupuestoDirecto } from "./iniciar-presupuesto-directo";
import { EditorPresupuesto } from "./editor-presupuesto";
import { ResumenPresupuesto } from "./resumen-presupuesto";
import { RespuestaOferta } from "./respuesta-oferta";
import { PrepararNuevaOferta } from "./renovar-oferta";
import { RetirarOferta } from "./retirar-oferta";
import { estadosPresupuesto } from "../modelo";

export async function PresupuestoOrden({
  ordenId, ordenPendiente, servicioDirecto, puedeIniciar, puedeEditar, puedeVersionar, puedeResponderEnTienda, puedeRetirar, mostrarVacio,
}: {
  ordenId: number; ordenPendiente: boolean; servicioDirecto?: boolean; puedeIniciar?: boolean;
  puedeEditar?: boolean; puedeVersionar?: boolean; puedeResponderEnTienda?: boolean; puedeRetirar?: boolean; mostrarVacio?: boolean;
}) {
  const ahora = new Date();
  const presupuesto = await obtenerPresupuestoOrden(ordenId, ahora);
  if (!presupuesto && puedeIniciar) return <IniciarPresupuestoDirecto ordenId={ordenId} />;
  if (!presupuesto) return mostrarVacio
    ? <p className="rounded-lg border p-4 text-muted-foreground">Todavía no hay un presupuesto para esta orden.</p> : null;

  const hoy = fechaBolivia(ahora);
  const disponible = ordenPendiente && presupuesto.estado === "PENDIENTE_APROBACION" && Boolean(presupuesto.fechaPresentacion) && presupuesto.venceEn !== null &&
    new Date(presupuesto.venceEn) > ahora && presupuesto.total !== null;
  const retirada = ordenPendiente && presupuesto.estado === "CANCELADO" && Boolean(presupuesto.fechaPresentacion);
  const nuevaVersion = puedeVersionar && ordenPendiente && (presupuesto.estado === "VENCIDO" || retirada);
  const editable = puedeEditar && presupuesto.estado === "BORRADOR";
  const [catalogo, catalogoRepuestos, historial] = await Promise.all([
    editable ? listarServiciosCotizables() : [],
    editable ? listarRepuestosCotizables() : [],
    presupuesto.version > 1 ? obtenerHistorialPresupuestos(ordenId, presupuesto.version) : [],
  ]);
  const versionAnterior = editable ? historial[0] : null;
  const omitidos = versionAnterior?.servicios.filter((anterior) =>
    !catalogo.some((servicio) => servicio.id === anterior.id) &&
    !presupuesto.servicios.some((servicio) => servicio.id === anterior.id)) ?? [];
  const impedimentoVersion = historial.some((anterior) => anterior.estado === "APROBADO") ? "La orden ya tiene un presupuesto principal aprobado." : null;

  return (
    <Card>
      <CardContent className="space-y-4">
        <ResumenPresupuesto presupuesto={presupuesto} mostrarCanal retirada={retirada} servicioDirecto={servicioDirecto} />
        {puedeResponderEnTienda && disponible && <RespuestaOferta key={presupuesto.id} presupuesto={presupuesto} origen={{ canal: "EN_TIENDA", ordenId }} puedeAprobar={Boolean(servicioDirecto)} />}
        {puedeRetirar && disponible && <RetirarOferta key={"retiro-" + presupuesto.id} ordenId={ordenId}
          presupuestoId={presupuesto.id} version={presupuesto.version} />}
        {retirada && <p className="text-sm text-muted-foreground">{servicioDirecto
          ? "La orden sigue abierta. Confirma en tienda la aceptación del presupuesto corregido."
          : "La orden sigue abierta. El cliente podrá responder cuando se presente la nueva versión."}</p>}
        {nuevaVersion && (impedimentoVersion
          ? <p className="text-sm text-muted-foreground">{impedimentoVersion}</p>
          : <PrepararNuevaOferta ordenId={ordenId} presupuestoId={presupuesto.id} version={presupuesto.version} desdeRetirada={retirada} />)}
        {omitidos.length > 0 && <div className="rounded-lg border p-3 text-sm">
          <p>Los siguientes servicios de la versión anterior ya no están disponibles. Revisa si debes reemplazarlos.</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {omitidos.map((partida) => <li key={partida.id}>{partida.nombre}</li>)}
          </ul>
        </div>}
        {editable && <EditorPresupuesto key={presupuesto.id} ordenId={ordenId} presupuesto={presupuesto} catalogo={catalogo} catalogoRepuestos={catalogoRepuestos} hoy={hoy} servicioDirecto={servicioDirecto} />}
        {historial.length > 0 && <section aria-label="Historial de presupuestos" className="grid gap-2 border-t pt-4">
          <h3 className="font-semibold">Versiones anteriores</h3>
          {historial.map((anterior) => {
            const anteriorRetirada = anterior.estado === "CANCELADO" && Boolean(anterior.fechaPresentacion);
            const estado = anteriorRetirada ? "Retirada" : estadosPresupuesto[anterior.estado];
            return (
              <details key={anterior.id} className="rounded-lg border p-3">
                <summary className="cursor-pointer font-medium">Versión {anterior.version} · {estado}</summary>
                <div className="pt-4"><ResumenPresupuesto presupuesto={anterior} mostrarCanal retirada={anteriorRetirada} servicioDirecto={servicioDirecto} /></div>
              </details>
            );
          })}
        </section>}
      </CardContent>
    </Card>
  );
}
