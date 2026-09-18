"""
API del predictor — sirve el Random Forest final del equipo.

Implementa el contrato definido en app/frontend/src/api/contrato.js. El
preprocesamiento lo hace `pipeline.py` con los objetos que exporta el notebook
(seccion 20.4), verificado contra el notebook por `verificar_pipeline.py`.

Uso, desde app/backend:

    python -m uvicorn api:app --port 8000

Si existe app/frontend/dist (npm run build), tambien sirve la interfaz en
http://localhost:8000, asi que la demo se levanta con un solo comando.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

import joblib
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from pipeline import Pipeline, pasajeros_a_crudo

RAIZ = Path(__file__).resolve().parents[2]
DIR_MODELO = Path(os.environ.get("MODELO_DIR", RAIZ / "data" / "processed"))
DIST = RAIZ / "app" / "frontend" / "dist"

UMBRAL = 0.5
MONTOS_SENSIBILIDAD = [0, 10, 30, 100, 300, 1000, 3000, 10000]

pipe = Pipeline(DIR_MODELO / "preprocesador.joblib")
modelo = joblib.load(DIR_MODELO / "modelo_final.joblib")
# El modelo se entreno con n_jobs=-1. Para predecir una fila, repartir los 800
# arboles entre nucleos cuesta mas de lo que ahorra: con n_jobs=1 la prediccion
# baja de ~107 a ~32 ms. Las probabilidades solo difieren en el orden de la suma
# de punto flotante (max 3.3e-16 sobre test, 0 clases distintas).
modelo.set_params(n_jobs=1)
GASTOS = pipe.SPEND_COLS

# Categorias crudas que acepta la API. Deck incluye "T", que el pipeline agrupa
# como "Otros" (seccion 5.1). Se comprueba al arrancar que coincidan con las que
# aprendio el OneHotEncoder: si el notebook cambia, la API no arranca en lugar de
# codificar en silencio una categoria desconocida como ceros.
HomePlanet = Literal["Earth", "Europa", "Mars"]
Destination = Literal["55 Cancri e", "PSO J318.5-22", "TRAPPIST-1e"]
Deck = Literal["A", "B", "C", "D", "E", "F", "G", "T"]
Side = Literal["P", "S"]

_aprendidas = dict(zip(pipe.CAT_NOMINALES, (list(c) for c in pipe.ohe.categories_)))
assert _aprendidas["HomePlanet"] == list(HomePlanet.__args__)
assert _aprendidas["Destination"] == list(Destination.__args__)
assert _aprendidas["Side"] == list(Side.__args__)
assert [("T" if d == "Otros" else d) for d in _aprendidas["Deck"]] == list(Deck.__args__)


class Pasajero(BaseModel):
    HomePlanet: HomePlanet
    CryoSleep: bool
    Destination: Destination
    Age: float = Field(ge=0, le=120)
    VIP: bool
    Deck: Deck
    Num: int = Field(ge=0, le=5000)
    Side: Side
    RoomService: float = Field(ge=0, le=100_000)
    FoodCourt: float = Field(ge=0, le=100_000)
    ShoppingMall: float = Field(ge=0, le=100_000)
    Spa: float = Field(ge=0, le=100_000)
    VRDeck: float = Field(ge=0, le=100_000)


def aplicar_regla_cryo(pasajero: dict) -> tuple[dict, bool]:
    """Regla de dominio de la seccion 4.1: en criosueno el gasto es exactamente 0.

    El modelo nunca vio un pasajero dormido con gasto: en train los 3,037 casos
    tienen los cinco rubros en 0. Predecir sobre esa combinacion seria extrapolar.
    """
    if not pasajero["CryoSleep"]:
        return pasajero, False
    return {**pasajero, **{g: 0.0 for g in GASTOS}}, True


def probabilidades(pasajeros: list[dict]) -> list[float]:
    X = pipe.transformar(pasajeros_a_crudo(pasajeros))
    return modelo.predict_proba(X)[:, 1].tolist()


# Pasajeros predefinidos para la demo. El "caso ambiguo" se eligio para que el
# modelo real de una probabilidad cercana a 0.5.
ARQUETIPOS = [
    {
        "id": "cryo-europa",
        "nombre": "Criogenizado de Europa",
        "descripcion": "Viaja dormido: por la regla de dominio no puede gastar nada.",
        "pasajero": {
            "HomePlanet": "Europa", "CryoSleep": True, "Destination": "55 Cancri e", "Age": 34,
            "VIP": False, "Deck": "B", "Num": 120, "Side": "S",
            "RoomService": 0, "FoodCourt": 0, "ShoppingMall": 0, "Spa": 0, "VRDeck": 0,
        },
    },
    {
        "id": "turista-tierra",
        "nombre": "Turista de la Tierra",
        "descripcion": "Despierto y gastando en spa, VR y room service.",
        "pasajero": {
            "HomePlanet": "Earth", "CryoSleep": False, "Destination": "TRAPPIST-1e", "Age": 38,
            "VIP": False, "Deck": "F", "Num": 900, "Side": "P",
            "RoomService": 800, "FoodCourt": 100, "ShoppingMall": 200, "Spa": 2000, "VRDeck": 1500,
        },
    },
    {
        "id": "comensal",
        "nombre": "El que solo come",
        "descripcion": "Todo su gasto es en el food court, el único con coeficiente positivo en la logística.",
        "pasajero": {
            "HomePlanet": "Earth", "CryoSleep": False, "Destination": "TRAPPIST-1e", "Age": 29,
            "VIP": False, "Deck": "G", "Num": 700, "Side": "S",
            "RoomService": 0, "FoodCourt": 3000, "ShoppingMall": 0, "Spa": 0, "VRDeck": 0,
        },
    },
    {
        "id": "ambiguo",
        "nombre": "Caso ambiguo",
        "descripcion": "Pasajero típico: aquí el modelo no tiene señal clara.",
        "pasajero": {
            # Elegido buscando entre 320 pasajeros tipicos el mas cercano a 0.5: da 0.504
            "HomePlanet": "Earth", "CryoSleep": False, "Destination": "TRAPPIST-1e", "Age": 27,
            "VIP": False, "Deck": "F", "Num": 1200, "Side": "S",
            "RoomService": 0, "FoodCourt": 20, "ShoppingMall": 0, "Spa": 0, "VRDeck": 0,
        },
    },
]

# Los arquetipos deben ser pasajeros validos para la propia API
for _a in ARQUETIPOS:
    Pasajero(**_a["pasajero"])


app = FastAPI(title="Spaceship Titanic — predictor", version="1.0")


@app.get("/api/metadata")
def metadata():
    return {
        "categorias": {
            "HomePlanet": list(HomePlanet.__args__),
            "Destination": list(Destination.__args__),
            "Deck": list(Deck.__args__),
            "Side": list(Side.__args__),
        },
        "rangos": {c: pipe.rangos[c] for c in ["Age", "Num", *GASTOS]},
        "gastos": GASTOS,
        "modelo": pipe.metricas,
    }


@app.get("/api/arquetipos")
def arquetipos():
    return ARQUETIPOS


@app.post("/api/predecir")
def predecir(pasajero: Pasajero):
    datos, regla = aplicar_regla_cryo(pasajero.model_dump())
    p = probabilidades([datos])[0]
    return {"probabilidad": p, "transportado": p >= UMBRAL, "regla_cryo_aplicada": regla}


@app.post("/api/sensibilidad")
def sensibilidad(pasajero: Pasajero):
    """Barre un gasto a la vez con el resto del pasajero fijo.

    Gastar en criosueno es imposible, asi que el barrido se hace despierto. Las
    5 x 8 filas van al modelo en una sola llamada.
    """
    base = {**pasajero.model_dump(), "CryoSleep": False}
    filas = [{**base, g: float(m)} for g in GASTOS for m in MONTOS_SENSIBILIDAD]
    probs = probabilidades(filas)
    n = len(MONTOS_SENSIBILIDAD)
    return {
        "montos": MONTOS_SENSIBILIDAD,
        "curvas": {g: probs[i * n:(i + 1) * n] for i, g in enumerate(GASTOS)},
        "cryo_forzado_a_false": pasajero.CryoSleep,
    }


@app.get("/api/salud")
def salud():
    return {
        "estado": "ok",
        "modelo": type(modelo).__name__,
        "n_arboles": modelo.n_estimators,
        "columnas": len(pipe.columnas_modelo),
        "sklearn_entrenamiento": pipe.sklearn_version,
    }


# Interfaz compilada (fase 4). Se monta al final para no tapar las rutas /api.
if DIST.exists():
    app.mount("/", StaticFiles(directory=DIST, html=True), name="interfaz")
