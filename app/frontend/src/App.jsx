import { useEffect, useState } from "react";
import { api, USAR_SIMULACION } from "./api/cliente.js";
import { GASTOS } from "./api/contrato.js";
import { usarConsultaDiferida } from "./util/usarConsultaDiferida.js";
import { SeccionCabeza } from "./components/ui.jsx";
import AvisoSimulacion from "./components/AvisoSimulacion.jsx";
import PanelPasajero from "./components/PanelPasajero.jsx";
import Resultado from "./components/Resultado.jsx";
import ReglaCryo from "./components/ReglaCryo.jsx";
import Sensibilidad from "./components/Sensibilidad.jsx";

// Pasajero con el que abre la interfaz: valores tipicos del dataset
// (medianas de Age y Num, categorias mas frecuentes).
const PASAJERO_INICIAL = {
  HomePlanet: "Earth",
  CryoSleep: false,
  Destination: "TRAPPIST-1e",
  Age: 27,
  VIP: false,
  Deck: "F",
  Num: 427,
  Side: "S",
  RoomService: 0,
  FoodCourt: 0,
  ShoppingMall: 0,
  Spa: 0,
  VRDeck: 0,
};

export default function App() {
  const [metadata, setMetadata] = useState(null);
  const [arquetipos, setArquetipos] = useState([]);
  const [errorCarga, setErrorCarga] = useState(null);
  const [pasajero, setPasajero] = useState(PASAJERO_INICIAL);
  const [arquetipoActivo, setArquetipoActivo] = useState(null);

  useEffect(() => {
    Promise.all([api.metadata(), api.arquetipos()])
      .then(([meta, arqs]) => {
        setMetadata(meta);
        setArquetipos(arqs);
      })
      .catch((error) => setErrorCarga(error.message));
  }, []);

  const listo = metadata !== null;
  const prediccion = usarConsultaDiferida(api.predecir, listo ? pasajero : null, 250);
  const sensibilidad = usarConsultaDiferida(api.sensibilidad, listo ? pasajero : null, 400);

  function actualizar(campo, valor) {
    setArquetipoActivo(null);
    setPasajero((previo) => {
      const nuevo = { ...previo, [campo]: valor };
      // Regla de dominio (seccion 4.1): en criosueno no se puede consumir nada
      if (campo === "CryoSleep" && valor === true) {
        for (const gasto of GASTOS) nuevo[gasto] = 0;
      }
      return nuevo;
    });
  }

  function cargarArquetipo(arquetipo) {
    setArquetipoActivo(arquetipo.id);
    setPasajero({ ...arquetipo.pasajero });
  }

  return (
    <>
      <nav className="nav">
        <span className="nav-brand">
          Spaceship Titanic <span>Equipo 6</span>
        </span>
      </nav>

      <main>
        {USAR_SIMULACION && <AvisoSimulacion />}

        <section id="predictor">
          <SeccionCabeza
            kicker="Predictor"
            titulo={
              <>
                Arma un pasajero y mira <em>qué decide el modelo</em>
              </>
            }
            lede="Los valores entran crudos, igual que en train.csv, y pasan por el mismo pipeline del avance 1 antes de llegar al Random Forest final del equipo."
          />

          {errorCarga && (
            <p className="error" role="alert">
              No se pudo cargar la API: {errorCarga}
            </p>
          )}

          {!listo && !errorCarga && <p className="cargando">Cargando…</p>}

          {listo && (
            <>
              <div className="grid wide-left">
                <PanelPasajero
                  pasajero={pasajero}
                  metadata={metadata}
                  onCambio={actualizar}
                  arquetipos={arquetipos}
                  arquetipoActivo={arquetipoActivo}
                  onArquetipo={cargarArquetipo}
                />

                <div className="col">
                  <Resultado estado={prediccion} modelo={metadata.modelo} />
                  {pasajero.CryoSleep && <ReglaCryo />}
                </div>
              </div>

              <div className="grid">
                <Sensibilidad estado={sensibilidad} />
              </div>
            </>
          )}
        </section>
      </main>

      <footer className="pie">
        <b>Inteligencia Artificial Avanzada · Equipo 6</b> — Reto Spaceship Titanic de Kaggle. Todas
        las cifras provienen del notebook del equipo.
      </footer>
    </>
  );
}
