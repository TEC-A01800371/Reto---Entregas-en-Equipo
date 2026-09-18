import { useId } from "react";
import { ETIQUETAS, GASTOS } from "../api/contrato.js";
import { PASOS, posicionAValor, valorAPosicion } from "../util/escalaLog.js";
import { Panel } from "./ui.jsx";

const formato = new Intl.NumberFormat("es-MX");
const NOMBRE_LADO = { P: "P — babor", S: "S — estribor" };

function Desplegable({ campo, opciones, valor, onCambio, nombre = (v) => v }) {
  const id = useId();
  return (
    <div className="campo">
      <label htmlFor={id}>{ETIQUETAS[campo]}</label>
      <select id={id} value={valor} onChange={(e) => onCambio(campo, e.target.value)}>
        {opciones.map((opcion) => (
          <option key={opcion} value={opcion}>
            {nombre(opcion)}
          </option>
        ))}
      </select>
    </div>
  );
}

// Par de botones Si / No, como en el diseño del equipo
function SiNo({ campo, valor, onCambio }) {
  const id = useId();
  return (
    <div className="campo">
      <span className="campo-label" id={id}>
        {ETIQUETAS[campo]}
      </span>
      <div className="switch-row" role="radiogroup" aria-labelledby={id}>
        <button
          type="button"
          role="radio"
          aria-checked={valor}
          className={`crece${valor ? " on" : ""}`}
          onClick={() => onCambio(campo, true)}
        >
          Sí
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!valor}
          className={`crece${!valor ? " on" : ""}`}
          onClick={() => onCambio(campo, false)}
        >
          No
        </button>
      </div>
    </div>
  );
}

function SliderLineal({ campo, rango, valor, onCambio, sufijo = "" }) {
  const id = useId();
  return (
    <div className="campo">
      <label htmlFor={id} className="campo-label">
        {ETIQUETAS[campo]}{" "}
        <b>
          {formato.format(valor)}
          {sufijo}
        </b>
      </label>
      <input
        id={id}
        type="range"
        min={rango.min}
        max={rango.max}
        step={1}
        value={valor}
        onChange={(e) => onCambio(campo, Number(e.target.value))}
      />
    </div>
  );
}

function SliderGasto({ campo, rango, valor, onCambio, bloqueado }) {
  const id = useId();
  return (
    <div className={`campo${bloqueado ? " bloqueado" : ""}`}>
      <label htmlFor={id} className="campo-label">
        {ETIQUETAS[campo]} <b>{formato.format(valor)}</b>
      </label>
      <input
        id={id}
        type="range"
        min={0}
        max={PASOS}
        step={1}
        value={valorAPosicion(valor, rango.max)}
        disabled={bloqueado}
        aria-valuetext={`${formato.format(valor)} créditos`}
        onChange={(e) => onCambio(campo, posicionAValor(Number(e.target.value), rango.max))}
      />
    </div>
  );
}

export default function PanelPasajero({ pasajero, metadata, onCambio, arquetipos, arquetipoActivo, onArquetipo }) {
  const { categorias, rangos } = metadata;
  const activo = arquetipos.find((a) => a.id === arquetipoActivo);
  const gastoTotal = GASTOS.reduce((suma, g) => suma + pasajero[g], 0);

  return (
    <Panel titulo="Datos del pasajero">
      <div className="presets" role="group" aria-label="Pasajeros de ejemplo">
        {arquetipos.map((arquetipo) => (
          <button
            key={arquetipo.id}
            type="button"
            className={arquetipoActivo === arquetipo.id ? "on" : ""}
            aria-pressed={arquetipoActivo === arquetipo.id}
            title={arquetipo.descripcion}
            onClick={() => onArquetipo(arquetipo)}
          >
            {arquetipo.nombre}
          </button>
        ))}
      </div>
      <p className="preset-desc" aria-live="polite">
        {activo ? activo.descripcion : "Elige un pasajero de ejemplo o ajusta los campos a mano."}
      </p>

      <div className="form-grid">
        <Desplegable campo="HomePlanet" opciones={categorias.HomePlanet} valor={pasajero.HomePlanet} onCambio={onCambio} />
        <Desplegable campo="Destination" opciones={categorias.Destination} valor={pasajero.Destination} onCambio={onCambio} />

        <SiNo campo="CryoSleep" valor={pasajero.CryoSleep} onCambio={onCambio} />
        <SiNo campo="VIP" valor={pasajero.VIP} onCambio={onCambio} />

        <SliderLineal campo="Age" rango={rangos.Age} valor={pasajero.Age} onCambio={onCambio} sufijo=" años" />
        <SliderLineal campo="Num" rango={rangos.Num} valor={pasajero.Num} onCambio={onCambio} />

        <Desplegable
          campo="Deck"
          opciones={categorias.Deck}
          valor={pasajero.Deck}
          onCambio={onCambio}
          nombre={(d) => (d === "T" ? "T (5 pasajeros, el modelo la agrupa en «Otros»)" : d)}
        />
        <Desplegable
          campo="Side"
          opciones={categorias.Side}
          valor={pasajero.Side}
          onCambio={onCambio}
          nombre={(s) => NOMBRE_LADO[s] ?? s}
        />
      </div>

      <div className="subgrupo">
        <div className="subgrupo-cabeza">
          <span className="panel-title">Gastos a bordo</span>
          <span className="campo-label">
            Total <b>{formato.format(gastoTotal)}</b>
          </span>
        </div>
        <p className="nota-chica">
          Escala logarítmica: la mitad de quienes gastan lo hacen por debajo de 400 créditos, pero hay
          montos de hasta 30,000. Es la misma asimetría que llevó a aplicar{" "}
          <span className="mono">log1p</span> en la sección 6.
        </p>
        <div className="form-grid">
          {GASTOS.map((gasto) => (
            <SliderGasto
              key={gasto}
              campo={gasto}
              rango={rangos[gasto]}
              valor={pasajero[gasto]}
              onCambio={onCambio}
              bloqueado={pasajero.CryoSleep}
            />
          ))}
        </div>
      </div>
    </Panel>
  );
}
