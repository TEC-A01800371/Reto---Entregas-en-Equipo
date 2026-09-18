import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Rutas relativas: el build lo sirve FastAPI desde su propia carpeta (fase 4)
  base: "./",
  server: {
    // En desarrollo, /api se reenvia al backend de FastAPI (fases 3 y 4).
    // Mientras USAR_SIMULACION = true no se hace ninguna peticion real.
    proxy: { "/api": "http://localhost:8000" },
  },
});
