"""
Verifica que `pipeline.py` reproduce EXACTAMENTE el preprocesamiento del notebook.

Si esto falla, la interfaz estaria mostrando predicciones que no son las del
modelo del equipo. Correr despues de cualquier cambio al pipeline:

    python verificar_pipeline.py

Comprobaciones:
  A. Lote: train.csv y test.csv crudos, completos, contra train_processed.csv y
     test_processed.csv que exporta la seccion 8.3 del notebook.
  B. Fila por fila: cada pasajero completo de test.csv procesado SOLO, como lo
     manda la interfaz, contra su fila de test_processed.csv.
  C. Predicciones: predict_proba sobre la salida del pipeline contra predict_proba
     sobre test_processed.csv.
"""

from __future__ import annotations

import sys
from pathlib import Path

import joblib
import numpy as np
import pandas as pd

from pipeline import Pipeline, pasajeros_a_crudo

RAIZ = Path(__file__).resolve().parents[2]
CRUDOS = RAIZ / "data" / "spaceship-titanic"
PROCESADOS = RAIZ / "data" / "processed"
TOLERANCIA = 1e-9

pipe = Pipeline(PROCESADOS / "preprocesador.joblib")
modelo = joblib.load(PROCESADOS / "modelo_final.joblib")
cols = pipe.columnas_modelo
fallos = 0


def comparar(nombre, obtenido, esperado):
    global fallos
    dif = np.abs(obtenido.to_numpy(dtype=float) - esperado.to_numpy(dtype=float)).max()
    ok = dif <= TOLERANCIA
    fallos += not ok
    print(f"  [{'OK ' if ok else 'MAL'}] {nombre:<52} diferencia maxima {dif:.2e}")


print("A. Lote completo contra los CSV procesados del notebook")
for archivo in ("train", "test"):
    crudo = pd.read_csv(CRUDOS / f"{archivo}.csv").drop(columns="Transported", errors="ignore")
    esperado = pd.read_csv(PROCESADOS / f"{archivo}_processed.csv")[cols]
    obtenido = pipe.transformar(crudo)
    comparar(f"{archivo}.csv ({len(crudo)} filas x {len(cols)} columnas)", obtenido, esperado)

print("\nB. Fila por fila, como llegan desde la interfaz")
test = pd.read_csv(CRUDOS / "test.csv")
test_proc = pd.read_csv(PROCESADOS / "test_processed.csv")[cols]
completos = test.dropna(subset=[c for c in test.columns if c != "Name"])
pasajeros = []
for _, fila in completos.iterrows():
    deck, num, side = fila["Cabin"].split("/")
    pasajeros.append({
        "HomePlanet": fila["HomePlanet"], "CryoSleep": bool(fila["CryoSleep"]),
        "Destination": fila["Destination"], "Age": fila["Age"], "VIP": bool(fila["VIP"]),
        "Deck": deck, "Num": int(num), "Side": side,
        **{g: fila[g] for g in pipe.SPEND_COLS},
    })
# Cada pasajero se procesa SOLO, en su propia llamada, como lo hace la API
por_fila = pd.concat([pipe.transformar(pasajeros_a_crudo([p])) for p in pasajeros], ignore_index=True)
comparar(f"{len(pasajeros)} pasajeros completos, uno por uno", por_fila, test_proc.loc[completos.index])

print("\nC. Predicciones del modelo")
p_pipeline = modelo.predict_proba(pipe.transformar(test.drop(columns=[])))[:, 1]
p_notebook = modelo.predict_proba(test_proc)[:, 1]
dif = np.abs(p_pipeline - p_notebook).max()
fallos += dif > TOLERANCIA
print(f"  [{'OK ' if dif <= TOLERANCIA else 'MAL'}] {'predict_proba en las 4277 filas de test':<52} diferencia maxima {dif:.2e}")
clases = (p_pipeline >= 0.5) == (p_notebook >= 0.5)
print(f"  [{'OK ' if clases.all() else 'MAL'}] {'clase predicha identica':<52} {clases.sum()}/{len(clases)} filas")
fallos += not clases.all()

print("\n" + ("PIPELINE VERIFICADO: reproduce exactamente el notebook" if fallos == 0 else f"{fallos} COMPROBACIONES FALLARON"))
sys.exit(1 if fallos else 0)
