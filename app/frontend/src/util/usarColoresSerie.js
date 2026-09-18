import { useEffect, useState } from "react";

/**
 * Lee los colores de serie definidos como variables CSS (--serie-1 ... --serie-N)
 * y los vuelve a leer si el sistema cambia entre modo claro y oscuro.
 * Recharts necesita el color resuelto como string para el atributo `stroke`.
 */
function leer(n) {
  const estilo = getComputedStyle(document.documentElement);
  return Array.from({ length: n }, (_, i) => estilo.getPropertyValue(`--serie-${i + 1}`).trim());
}

export function usarColoresSerie(n) {
  const [colores, setColores] = useState(() => leer(n));

  useEffect(() => {
    const consulta = window.matchMedia("(prefers-color-scheme: dark)");
    const actualizar = () => setColores(leer(n));
    consulta.addEventListener("change", actualizar);
    return () => consulta.removeEventListener("change", actualizar);
  }, [n]);

  return colores;
}
