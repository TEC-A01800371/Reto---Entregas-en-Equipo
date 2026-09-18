/**
 * Escala logaritmica para los sliders de gasto.
 *
 * El gasto maximo va de 14,000 a 30,000 pero la mediana de quienes gastan es de
 * apenas 200 a 400: con un slider lineal casi todos los pasajeros reales caerian
 * en el primer 2% del recorrido. Es la misma asimetria que llevo a la seccion 6
 * del notebook a aplicar log1p a estas columnas.
 *
 * posicion (0..PASOS)  <->  valor (0..max),  con valor = expm1(posicion/PASOS * log1p(max))
 */
export const PASOS = 1000;

export function posicionAValor(posicion, max) {
  const valor = Math.expm1((posicion / PASOS) * Math.log1p(max));
  // Redondeo amigable: enteros chicos exactos, montos grandes a la decena
  return valor < 100 ? Math.round(valor) : Math.round(valor / 10) * 10;
}

export function valorAPosicion(valor, max) {
  if (valor <= 0) return 0;
  return Math.round((Math.log1p(valor) / Math.log1p(max)) * PASOS);
}
