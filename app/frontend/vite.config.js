import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Rutas relativas: el build lo sirve FastAPI desde su propia carpeta (fase 4)
  base: "./",
  server: {
    // En desarrollo, /api se reenvia al backend de FastAPI (fases 3 y 4).
    // Mientras USAR_SIMULACION = true no se hace ninguna peticion real.
    // 127.0.0.1 y no "localhost": en Windows, "localhost" intenta primero IPv6,
    // uvicorn solo escucha en IPv4 y cada peticion pagaba ~200 ms de espera.
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
});
