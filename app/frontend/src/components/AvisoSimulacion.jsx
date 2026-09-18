import { Callout } from "./ui.jsx";

export default function AvisoSimulacion() {
  return (
    <Callout tono="warn" role="status" className="aviso-simulacion">
      <b>Datos de prueba.</b> Los números en pantalla <b>no son del modelo</b>: la interfaz está
      conectada a una API simulada. Cambia <span className="mono">USAR_SIMULACION</span> a{" "}
      <span className="mono">false</span> en <span className="mono">src/api/cliente.js</span> cuando el
      backend esté listo.
    </Callout>
  );
}
