# Predictor — Spaceship Titanic

Interfaz para armar un pasajero y ver la probabilidad de que el **Random Forest final del equipo**
(800 árboles, sección 17 del notebook) lo considere transportado. Es el mismo modelo que generó
`submission.csv`, con el mismo preprocesamiento.

## Levantarlo (un solo comando)

Desde la raíz del repositorio:

```bash
./.venv/Scripts/python.exe -m uvicorn api:app --app-dir app/backend --port 8000
```

Abrir **http://127.0.0.1:8000**. FastAPI sirve la API y la interfaz ya compilada.

> Usar `127.0.0.1` y no `localhost`: en Windows, `localhost` prueba primero IPv6 y cada petición
> espera ~200 ms de más.

La primera vez, instalar dependencias:

```bash
./.venv/Scripts/python.exe -m pip install -r app/backend/requirements.txt
npm --prefix app/frontend install
npm --prefix app/frontend run build
```

## Cómo funciona

```
Interfaz (React + Vite)  ──POST /api/predecir──►  FastAPI
                                                   │
                         pipeline.py: las 7 funciones del notebook (secciones 4 a 7 + 15),
                         con los objetos ajustados que exporta preprocesador.joblib
                                                   │
                         modelo_final.joblib ──► probabilidad
```

- **`backend/pipeline.py`** — copia textual de las funciones de preprocesamiento del notebook. No
  reimplementa ni re-ajusta nada: medianas, modas, `OneHotEncoder` y `RobustScaler` se cargan de
  `data/processed/preprocesador.joblib`.
- **`backend/api.py`** — cuatro endpoints (`metadata`, `arquetipos`, `predecir`, `sensibilidad`) más
  `salud`. El contrato está documentado en `frontend/src/api/contrato.js`.
- **`frontend/`** — React + Vite con la estética del equipo.

## Verificación

```bash
cd app/backend
../../.venv/Scripts/python.exe verificar_pipeline.py
```

Compara el pipeline contra los CSV que produce el notebook: en lote (8,693 + 4,277 filas), pasajero
por pasajero como llegan desde la interfaz, y a nivel de `predict_proba`. Resultado actual: diferencia
máxima de 4e-16 y las 4,277 clases idénticas. **Correrlo después de cualquier cambio al pipeline del
notebook.**

## Regenerar el preprocesador

`preprocesador.joblib` lo genera la celda **20.4** del notebook. Si el notebook cambia, reejecutarlo
completo y volver a correr la verificación.

## Desarrollo de la interfaz

```bash
npm --prefix app/frontend run dev      # http://localhost:5173, reenvía /api al puerto 8000
```

Para trabajar en la interfaz sin el backend, poner `USAR_SIMULACION = true` en
`frontend/src/api/cliente.js`: la UI mostrará un aviso de que los números no son del modelo.
