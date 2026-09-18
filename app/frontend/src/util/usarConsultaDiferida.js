import { useEffect, useRef, useState } from "react";

/**
 * Ejecuta `consulta(entrada)` cuando `entrada` deja de cambiar durante `esperaMs`.
 *
 * - Debounce: mover un slider no dispara una peticion por cada pixel.
 * - Descarta respuestas viejas: si llega tarde la respuesta de una entrada
 *   anterior, se ignora y no pisa a la mas reciente.
 */
export function usarConsultaDiferida(consulta, entrada, esperaMs = 250) {
  const [estado, setEstado] = useState({ datos: null, cargando: false, error: null });
  const ultimaPeticion = useRef(0);
  const clave = entrada ? JSON.stringify(entrada) : null;

  useEffect(() => {
    if (!clave) return undefined;
    setEstado((previo) => ({ ...previo, cargando: true }));

    const temporizador = setTimeout(() => {
      const id = ++ultimaPeticion.current;
      consulta(JSON.parse(clave))
        .then((datos) => {
          if (id === ultimaPeticion.current) setEstado({ datos, cargando: false, error: null });
        })
        .catch((error) => {
          if (id === ultimaPeticion.current)
            setEstado((previo) => ({ ...previo, cargando: false, error: error.message }));
        });
    }, esperaMs);

    return () => clearTimeout(temporizador);
  }, [clave, consulta, esperaMs]);

  return estado;
}
