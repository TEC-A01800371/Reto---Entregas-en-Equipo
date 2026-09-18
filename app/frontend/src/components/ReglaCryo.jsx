import { Callout } from "./ui.jsx";

export default function ReglaCryo() {
  return (
    <Callout tono="info" aria-live="polite">
      <b>Regla de dominio activa.</b> Un pasajero en criosueño viaja dormido y no puede consumir nada,
      así que sus cinco gastos quedan fijos en 0. No es una decisión de la interfaz: en el EDA, el gasto
      de todos los pasajeros con <span className="mono">CryoSleep = True</span> sumó exactamente 0
      (sección 2.1), y el pipeline usa esa regla para imputar sus gastos faltantes (sección 4.1).
    </Callout>
  );
}
