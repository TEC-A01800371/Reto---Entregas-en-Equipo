import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ETIQUETAS, GASTOS } from "../api/contrato.js";
import { usarColoresSerie } from "../util/usarColoresSerie.js";
import { Callout, Panel } from "./ui.jsx";

const formatoMonto = new Intl.NumberFormat("es-MX");
const pct = (x) => `${Math.round(x * 100)}%`;
const DESTACADA = "FoodCourt";

function TooltipSensibilidad({ active, payload, label, colores }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip">
      <p className="tooltip-titulo">Gasto de {formatoMonto.format(label)} créditos</p>
      <ul>
        {GASTOS.map((gasto, i) => {
          const punto = payload.find((p) => p.dataKey === gasto);
          if (!punto) return null;
          return (
            <li key={gasto}>
              <span className="legend-swatch" style={{ background: colores[i] }} aria-hidden="true" />
              <span className="tooltip-serie">{ETIQUETAS[gasto]}</span>
              <span className="tooltip-valor">{pct(punto.value)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function Sensibilidad({ estado }) {
  const colores = usarColoresSerie(GASTOS.length);
  const [verTabla, setVerTabla] = useState(false);
  const { datos, cargando, error } = estado;

  const filas = datos
    ? datos.montos.map((monto, i) => ({
        monto,
        ...Object.fromEntries(GASTOS.map((g) => [g, datos.curvas[g][i]])),
      }))
    : [];

  return (
    <Panel className={cargando ? "actualizando" : ""}>
      <div className="encabezado-grafica">
        <div>
          <div className="panel-title">Sensibilidad al gasto</div>
          <h3>¿Cómo mueve cada gasto la predicción?</h3>
          <p>
            Se sube un gasto a la vez, dejando el resto del pasajero igual. El Random Forest separa los
            gastos en <b>dos grupos</b>: food court y centro comercial suben la probabilidad; room service,
            spa y VR deck la bajan. La regresión logística solo había detectado el efecto de{" "}
            <b>{ETIQUETAS[DESTACADA]}</b> (sección 11.1). El patrón se repite con pasajeros de distintos
            planetas y cubiertas; lo que cambia es su magnitud.
          </p>
        </div>
        <button type="button" onClick={() => setVerTabla((v) => !v)}>
          {verTabla ? "Ver gráfica" : "Ver tabla"}
        </button>
      </div>

      {error && (
        <Callout tono="bad" role="alert">
          No se pudo calcular la sensibilidad: {error}
        </Callout>
      )}

      {datos?.cryo_forzado_a_false && (
        <p className="nota-chica">
          El pasajero está en criosueño, donde gastar es imposible. El barrido se calcula como si estuviera
          despierto.
        </p>
      )}

      {datos && !verTabla && (
        <div className="grafica" role="img" aria-label="Probabilidad de ser transportado según el monto de cada gasto">
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={filas} margin={{ top: 12, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.07)" vertical={false} />
              <XAxis
                dataKey="monto"
                tickFormatter={(m) => formatoMonto.format(m)}
                stroke="rgba(255,255,255,0.18)"
                tick={{ fill: "var(--text-3)", fontSize: 11 }}
                label={{
                  value: "Monto del gasto (créditos, escala logarítmica)",
                  position: "insideBottom",
                  offset: -4,
                  fill: "var(--text-3)",
                  fontSize: 11,
                }}
                height={44}
              />
              <YAxis
                domain={[0, 1]}
                ticks={[0, 0.25, 0.5, 0.75, 1]}
                tickFormatter={pct}
                stroke="rgba(255,255,255,0.18)"
                tick={{ fill: "var(--text-3)", fontSize: 11 }}
                width={48}
              />
              <ReferenceLine y={0.5} stroke="var(--text-3)" strokeDasharray="4 4" />
              <Tooltip
                content={<TooltipSensibilidad colores={colores} />}
                cursor={{ stroke: "var(--text-3)", strokeWidth: 1 }}
              />
              <Legend
                verticalAlign="top"
                height={32}
                itemSorter={(item) => GASTOS.indexOf(item.dataKey)}
                formatter={(valor) => <span className="leyenda-texto">{ETIQUETAS[valor]}</span>}
              />
              {GASTOS.map((gasto, i) => (
                <Line
                  key={gasto}
                  type="linear" // segmentos rectos: suavizar inventaria valores entre montos
                  dataKey={gasto}
                  name={gasto}
                  stroke={colores[i]}
                  strokeWidth={gasto === DESTACADA ? 3 : 2}
                  dot={{ r: 4, strokeWidth: 2, stroke: "var(--bg)", fill: colores[i] }}
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "var(--bg)" }}
                  isAnimationActive={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {datos && verTabla && (
        <div className="tabla-wrap">
          <table>
            <caption>Probabilidad de ser transportado según el monto de cada gasto</caption>
            <thead>
              <tr>
                <th scope="col">Monto</th>
                {GASTOS.map((g) => (
                  <th key={g} scope="col">
                    {ETIQUETAS[g]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.monto}>
                  <td>{formatoMonto.format(fila.monto)}</td>
                  {GASTOS.map((g) => (
                    <td key={g}>{pct(fila[g])}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
