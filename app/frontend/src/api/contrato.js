/**
 * CONTRATO DE LA API
 * ==================
 * Define que pide y que devuelve cada endpoint. El frontend (fase 1) se escribe
 * contra estas formas; el backend de FastAPI (fase 3) debe cumplirlas al pie de
 * la letra para que conectar sea solo cambiar USAR_SIMULACION en cliente.js.
 *
 * Pasajero — los atributos crudos del dataset de Kaggle. `Cabin` se entrega ya
 * separada en Deck / Num / Side; el backend la vuelve a armar como "Deck/Num/Side"
 * para pasarla por la funcion `derivar` del notebook (seccion 4.0).
 *
 *   {
 *     HomePlanet:   "Earth" | "Europa" | "Mars",
 *     CryoSleep:    boolean,
 *     Destination:  "TRAPPIST-1e" | "55 Cancri e" | "PSO J318.5-22",
 *     Age:          number,          // 0 a 79
 *     VIP:          boolean,
 *     Deck:         "A".."G" | "T",  // el modelo agrupa "T" como "Otros" (seccion 5.1)
 *     Num:          number,          // 0 a 1894
 *     Side:         "P" | "S",
 *     RoomService, FoodCourt, ShoppingMall, Spa, VRDeck: number   // >= 0
 *   }
 *
 * GET  /api/metadata
 *   -> {
 *        categorias: { HomePlanet: [...], Destination: [...], Deck: [...], Side: [...] },
 *        rangos:     { Age: {min, max}, Num: {min, max}, RoomService: {min, max}, ... },
 *        gastos:     ["RoomService", "FoodCourt", "ShoppingMall", "Spa", "VRDeck"],
 *        modelo:     { nombre, accuracy, roc_auc, n_arboles }
 *      }
 *
 * POST /api/predecir          body: Pasajero
 *   -> { probabilidad: number (0..1), transportado: boolean, regla_cryo_aplicada: boolean }
 *
 *   `regla_cryo_aplicada` es true cuando el pipeline forzo los gastos a 0 por la
 *   regla de dominio de la seccion 4.1 (CryoSleep = true => no puede consumir).
 *
 * POST /api/sensibilidad      body: Pasajero (el pasajero base)
 *   -> {
 *        montos: number[],                          // valores de gasto barridos, iguales para los 5
 *        curvas: { RoomService: number[], ... },    // probabilidad en cada monto
 *        cryo_forzado_a_false: boolean              // el barrido de gasto exige CryoSleep = false
 *      }
 *
 *   Se barre UN gasto a la vez manteniendo el resto del pasajero fijo. Si el
 *   pasajero base viene en CryoSleep, el barrido se hace con CryoSleep = false,
 *   porque gastar en criosueno es imposible y el modelo nunca vio ese caso.
 *
 * GET  /api/arquetipos
 *   -> [{ id, nombre, descripcion, pasajero: Pasajero }]
 */

export const GASTOS = ["RoomService", "FoodCourt", "ShoppingMall", "Spa", "VRDeck"];

export const ETIQUETAS = {
  HomePlanet: "Planeta de origen",
  CryoSleep: "Criosueño",
  Destination: "Destino",
  Age: "Edad",
  VIP: "VIP",
  Deck: "Cubierta",
  Num: "Número de cabina",
  Side: "Lado",
  RoomService: "Room service",
  FoodCourt: "Food court",
  ShoppingMall: "Centro comercial",
  Spa: "Spa",
  VRDeck: "VR deck",
};
