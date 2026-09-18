import { USAR_SIMULACION } from "../api/cliente.js";
import { Badge, Callout } from "./ui.jsx";

const UMBRAL = 0.5;
const ZONA_INCIERTA = [0.45, 0.55];

const pct = (x) => `${(x * 100).toFixed(1)}%`;

export default function Resultado({ estado, modelo }) {
  const { datos, cargando, error } = estado;

  if (error) {
    return (
      <Callout tono="bad" role="alert">
        No se pudo obtener la predicción: {error}
      </Callout>
    );
  }

  if (!datos) {
    return (
      <div className="veredicto">
        <span className="cargando">Calculando…</span>
      </div>
    );
  }

  const p = datos.probabilidad;
  const transportado = datos.transportado;
  const incierto = p >= ZONA_INCIERTA[0] && p <= ZONA_INCIERTA[1];

  return (
    <div
      className={`veredicto ${transportado ? "si" : "no"}${cargando ? " actualizando" : ""}`}
      aria-live="polite"
      aria-busy={cargando}
    >
      <div>
        <span className="stat-label">Predicción del modelo</span>
        <div className="veredicto-titulo">{transportado ? "Transportado" : "No transportado"}</div>
      </div>

      <div>
        <div className="prob-num">
          {(p * 100).toFixed(1)}
          <small>%</small>
        </div>
        <span className="stat-note">probabilidad de haber sido transportado</span>
      </div>

      <div>
        <div
          className="barra"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(p * 100)}
          aria-label="Probabilidad de ser transportado"
        >
          <div
            className="barra-zona"
            style={{ left: pct(ZONA_INCIERTA[0]), width: pct(ZONA_INCIERTA[1] - ZONA_INCIERTA[0]) }}
          />
          <div
            className="barra-fill"
            style={{
              width: pct(p),
              background: transportado
                ? "linear-gradient(90deg, var(--cyan), var(--lime))"
                : "linear-gradient(90deg, var(--violet), var(--rose))",
            }}
          />
          <div className="barra-umbral" style={{ left: pct(UMBRAL) }} />
        </div>
        <div className="barra-escala" aria-hidden="true">
          <span>0%</span>
          <span>umbral 50%</span>
          <span>100%</span>
        </div>
      </div>

      {incierto && (
        <Callout tono="warn">
          <b>Zona de incertidumbre.</b> Para este pasajero el modelo casi no distingue entre las dos
          clases. Es el techo del ~81% de accuracy hecho visible: siete modelos de cuatro familias
          distintas se quedaron en el mismo rango, porque la información de estas variables no alcanza
          para más (secciones 16 y 19).
        </Callout>
      )}

      <div className="veredicto-pie">
        <Badge tono={USAR_SIMULACION ? "warn" : "up"}>
          {USAR_SIMULACION ? "API simulada — no es el modelo" : `${modelo.nombre} · ${modelo.n_arboles} árboles`}
        </Badge>
        <span className="stat-note">
          accuracy {(modelo.accuracy * 100).toFixed(1)}% · ROC-AUC {modelo.roc_auc.toFixed(3)} en el
          conjunto de prueba. La clase sale de cortar la probabilidad en 50%.
        </span>
      </div>
    </div>
  );
}
