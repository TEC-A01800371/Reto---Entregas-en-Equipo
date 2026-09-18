/**
 * API SIMULADA — solo para construir la interfaz antes de tener el backend.
 *
 * Las respuestas tienen la forma exacta del contrato, pero los NUMEROS NO SON
 * DEL MODELO: salen de un hash del pasajero, deterministas (el mismo pasajero da
 * siempre el mismo valor) y sin ninguna relacion con el Random Forest. Imitar al
 * modelo seria peor que no hacerlo: una simulacion creible es la que alguien
 * termina presentando por error.
 *
 * Lo que SI es real aqui: las categorias y los rangos de `metadata`, leidos de
 * train.csv, y las metricas del modelo (seccion 18 del notebook).
 */
import { GASTOS } from "./contrato.js";

const LATENCIA_MS = 120; // para que la UI se pruebe con una espera realista

const esperar = (valor) =>
  new Promise((resolver) => setTimeout(() => resolver(structuredClone(valor)), LATENCIA_MS));

// Hash FNV-1a de 32 bits -> numero en [0, 1). Determinista y sin significado.
function hash01(texto) {
  let h = 0x811c9dc5;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296;
}

const probabilidadFalsa = (semilla) => 0.05 + 0.9 * hash01(semilla);

const METADATA = {
  categorias: {
    HomePlanet: ["Earth", "Europa", "Mars"],
    Destination: ["TRAPPIST-1e", "55 Cancri e", "PSO J318.5-22"],
    Deck: ["A", "B", "C", "D", "E", "F", "G", "T"],
    Side: ["P", "S"],
  },
  // Maximos reales de train.csv
  rangos: {
    Age: { min: 0, max: 79 },
    Num: { min: 0, max: 1894 },
    RoomService: { min: 0, max: 14327 },
    FoodCourt: { min: 0, max: 29813 },
    ShoppingMall: { min: 0, max: 23492 },
    Spa: { min: 0, max: 22408 },
    VRDeck: { min: 0, max: 24133 },
  },
  gastos: GASTOS,
  // Metricas reales del RF tuneado sobre X_test_c (seccion 18 del notebook)
  modelo: { nombre: "Random Forest tuneado", accuracy: 0.8085, roc_auc: 0.9027, n_arboles: 800 },
};

// Los arquetipos son contenido de demo. La fase 3 debe portar esta misma lista
// al backend y, en particular, elegir un "caso ambiguo" que de verdad caiga cerca
// de 0.5 con el modelo real: aqui es solo un candidato razonable.
const ARQUETIPOS = [
  {
    id: "cryo-europa",
    nombre: "Criogenizado de Europa",
    descripcion: "Viaja dormido: por la regla de dominio no puede gastar nada.",
    pasajero: {
      HomePlanet: "Europa", CryoSleep: true, Destination: "55 Cancri e", Age: 34, VIP: false,
      Deck: "B", Num: 120, Side: "S",
      RoomService: 0, FoodCourt: 0, ShoppingMall: 0, Spa: 0, VRDeck: 0,
    },
  },
  {
    id: "turista-tierra",
    nombre: "Turista de la Tierra",
    descripcion: "Despierto y gastando en spa, VR y room service.",
    pasajero: {
      HomePlanet: "Earth", CryoSleep: false, Destination: "TRAPPIST-1e", Age: 38, VIP: false,
      Deck: "F", Num: 900, Side: "P",
      RoomService: 800, FoodCourt: 100, ShoppingMall: 200, Spa: 2000, VRDeck: 1500,
    },
  },
  {
    id: "comensal",
    nombre: "El que solo come",
    descripcion: "Todo su gasto es en el food court, el único con coeficiente positivo en la logística.",
    pasajero: {
      HomePlanet: "Earth", CryoSleep: false, Destination: "TRAPPIST-1e", Age: 29, VIP: false,
      Deck: "G", Num: 700, Side: "S",
      RoomService: 0, FoodCourt: 3000, ShoppingMall: 0, Spa: 0, VRDeck: 0,
    },
  },
  {
    id: "ambiguo",
    nombre: "Caso ambiguo",
    descripcion: "Pasajero típico: aquí el modelo no tiene señal clara.",
    pasajero: {
      HomePlanet: "Earth", CryoSleep: false, Destination: "TRAPPIST-1e", Age: 27, VIP: false,
      Deck: "G", Num: 427, Side: "S",
      RoomService: 0, FoodCourt: 20, ShoppingMall: 30, Spa: 0, VRDeck: 10,
    },
  },
];

const MONTOS_SENSIBILIDAD = [0, 10, 30, 100, 300, 1000, 3000, 10000];

export const simulado = {
  metadata: () => esperar(METADATA),

  arquetipos: () => esperar(ARQUETIPOS),

  predecir: (pasajero) => {
    const regla = pasajero.CryoSleep === true;
    const efectivo = regla ? { ...pasajero, ...Object.fromEntries(GASTOS.map((g) => [g, 0])) } : pasajero;
    const probabilidad = probabilidadFalsa(JSON.stringify(efectivo));
    return esperar({ probabilidad, transportado: probabilidad >= 0.5, regla_cryo_aplicada: regla });
  },

  sensibilidad: (pasajero) => {
    const base = { ...pasajero, CryoSleep: false };
    const curvas = Object.fromEntries(
      GASTOS.map((g) => [
        g,
        MONTOS_SENSIBILIDAD.map((monto) => probabilidadFalsa(JSON.stringify({ ...base, [g]: monto }))),
      ])
    );
    return esperar({ montos: MONTOS_SENSIBILIDAD, curvas, cryo_forzado_a_false: pasajero.CryoSleep === true });
  },
};
