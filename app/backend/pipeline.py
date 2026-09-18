"""
Pipeline de preprocesamiento del notebook, empaquetado para usarse fuera de el.

Las funciones de abajo son COPIA TEXTUAL de las del notebook
(SpaceShip_Titanic/spaceship_titanic_preprocesamiento.ipynb, secciones 4 a 7 y 15).
No se reimplementa ni se re-ajusta nada: los objetos ajustados (medianas y modas,
OneHotEncoder, RobustScaler) se cargan de `preprocesador.joblib`, que exporta la
propia seccion 20.4 del notebook.

Si alguna de estas funciones cambia en el notebook, hay que cambiarla aqui igual:
`verificar_pipeline.py` detecta cualquier diferencia comparando contra
`test_processed.csv`.
"""

from __future__ import annotations

from pathlib import Path

import joblib
import numpy as np
import pandas as pd


class Pipeline:
    def __init__(self, ruta_preprocesador: Path):
        art = joblib.load(ruta_preprocesador)

        self.params = art["params"]
        self.ohe = art["ohe"]
        self.escalador = art["escalador"]

        self.SPEND_COLS = art["SPEND_COLS"]
        self.NUM_COLS = art["NUM_COLS"]
        self.CAT_NOMINALES = art["CAT_NOMINALES"]
        self.BOOL_COLS = art["BOOL_COLS"]
        self.DESCARTAR = art["DESCARTAR"]
        self.A_TRANSFORMAR = art["A_TRANSFORMAR"]
        self.CATEGORIAS_BASE = art["CATEGORIAS_BASE"]
        self.columnas_modelo = art["columnas_modelo"]

        self.rangos = art["rangos"]
        self.metricas = art["metricas"]
        self.sklearn_version = art["sklearn_version"]

    # ---- 4.0 ------------------------------------------------------------------
    def derivar(self, df):
        d = df.copy()
        d["Group"] = d["PassengerId"].str.split("_").str[0]
        cabina = d["Cabin"].str.split("/", expand=True)
        d["Deck"] = cabina[0]
        d["Num"] = pd.to_numeric(cabina[1], errors="coerce")
        d["Side"] = cabina[2]
        return d.drop(columns=self.DESCARTAR)

    # ---- 4.1 ------------------------------------------------------------------
    def imputar_informativos(self, df):
        d = df.copy()

        dormido = d["CryoSleep"] == True  # noqa: E712  (identico al notebook)
        for col in self.SPEND_COLS:
            d.loc[dormido & d[col].isna(), col] = 0.0

        gasto_total = d[self.SPEND_COLS].sum(axis=1, min_count=1)
        d.loc[d["CryoSleep"].isna() & (gasto_total > 0), "CryoSleep"] = False

        for col in ["HomePlanet", "Deck", "Side"]:
            moda_grupo = d.groupby("Group")[col].transform(
                lambda s: s.mode().iloc[0] if s.notna().any() else np.nan
            )
            d[col] = d[col].fillna(moda_grupo)

        return d

    # ---- 4.3 ------------------------------------------------------------------
    def imputar_reales(self, df):
        d = df.copy()
        for col, valor in {**self.params["mediana"], **self.params["moda"]}.items():
            d[col] = d[col].fillna(valor)

        for col in ["CryoSleep", "VIP"]:
            d[col] = d[col].astype(bool)

        return d.drop(columns="Group")

    # ---- 5.1 ------------------------------------------------------------------
    def preparar_categoricas(self, df):
        d = df.copy()
        for col in self.BOOL_COLS:
            d[col] = d[col].astype(int)
        d["Deck"] = d["Deck"].replace("T", "Otros")
        return d

    # ---- 5.2 ------------------------------------------------------------------
    def aplicar_ohe(self, df):
        d = df.copy()
        matriz = self.ohe.transform(d[self.CAT_NOMINALES])
        nombres = self.ohe.get_feature_names_out(self.CAT_NOMINALES)
        dummies = pd.DataFrame(matriz, columns=nombres, index=d.index).astype(int)
        return pd.concat([d.drop(columns=self.CAT_NOMINALES), dummies], axis=1)

    # ---- 6.2 ------------------------------------------------------------------
    def transformar_sesgo(self, df):
        d = df.copy()
        for col in self.A_TRANSFORMAR:
            d[col] = np.log1p(d[col])
        return d

    # ---- 7.3 ------------------------------------------------------------------
    def escalar(self, df):
        d = df.copy()
        d[self.NUM_COLS] = self.escalador.transform(d[self.NUM_COLS])
        return d

    # ---- Cadena completa ------------------------------------------------------
    def transformar(self, crudo: pd.DataFrame) -> pd.DataFrame:
        """Filas crudas con el esquema de train.csv -> matriz de 21 columnas del modelo.

        Mismo orden que el notebook: 4.0 -> 4.1 -> 4.3 -> 5.1 -> 5.2 -> 6.2 -> 7.3,
        y al final la correccion de la seccion 15 (quitar las categorias base).
        """
        d = self.derivar(crudo)
        d = self.imputar_informativos(d)
        d = self.imputar_reales(d)
        d = self.preparar_categoricas(d)
        d = self.aplicar_ohe(d)
        d = self.transformar_sesgo(d)
        d = self.escalar(d)
        d = d.drop(columns=self.CATEGORIAS_BASE)

        faltan = set(self.columnas_modelo) - set(d.columns)
        if faltan:
            raise ValueError(f"el pipeline no produjo las columnas {sorted(faltan)}")
        return d[self.columnas_modelo]


def pasajeros_a_crudo(pasajeros: list[dict]) -> pd.DataFrame:
    """Pasajeros de la interfaz (Cabin separada en Deck/Num/Side) -> esquema de train.csv.

    `Cabin` se vuelve a armar como "Deck/Num/Side" para que pase por `derivar`
    igual que los datos de Kaggle. `PassengerId` recibe un grupo propio por fila:
    cada pasajero de la interfaz viaja solo, asi que la imputacion por grupo de la
    seccion 4.1 no mezcla informacion entre filas.
    """
    filas = []
    for i, p in enumerate(pasajeros):
        filas.append({
            "PassengerId": f"{9000 + i:04d}_01",
            "HomePlanet": p["HomePlanet"],
            "CryoSleep": p["CryoSleep"],
            "Cabin": f'{p["Deck"]}/{int(p["Num"])}/{p["Side"]}',
            "Destination": p["Destination"],
            "Age": float(p["Age"]),
            "VIP": p["VIP"],
            "RoomService": float(p["RoomService"]),
            "FoodCourt": float(p["FoodCourt"]),
            "ShoppingMall": float(p["ShoppingMall"]),
            "Spa": float(p["Spa"]),
            "VRDeck": float(p["VRDeck"]),
            "Name": "Pasajero Demo",
        })
    return pd.DataFrame(filas)
