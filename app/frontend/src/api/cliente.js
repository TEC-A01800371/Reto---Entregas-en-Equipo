/**
 * Punto unico por el que la interfaz habla con la API.
 *
 * FASE 4: cuando el backend de FastAPI este verificado, cambiar a `false`.
 * Ningun componente necesita tocarse: todos llaman a `api.*`.
 */
import { simulado } from "./simulado.js";

export const USAR_SIMULACION = true;

async function pedir(ruta, opciones = {}) {
  const respuesta = await fetch(ruta, {
    headers: { "Content-Type": "application/json" },
    ...opciones,
  });
  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    throw new Error(`${ruta} respondio ${respuesta.status} ${detalle}`.trim());
  }
  return respuesta.json();
}

const real = {
  metadata: () => pedir("/api/metadata"),
  arquetipos: () => pedir("/api/arquetipos"),
  predecir: (pasajero) => pedir("/api/predecir", { method: "POST", body: JSON.stringify(pasajero) }),
  sensibilidad: (pasajero) => pedir("/api/sensibilidad", { method: "POST", body: JSON.stringify(pasajero) }),
};

export const api = USAR_SIMULACION ? simulado : real;
