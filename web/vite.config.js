import { defineConfig } from "vite";
import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In dev, proxy /api to the local API server so the frontend and backend
// share an origin (no CORS juggling).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api": "http://localhost:4000",
    },
  },
  build: {
    rollupOptions: {
      input: {
        // Dashboard app (default entry).
        main: resolve(__dirname, "index.html"),
        // Standalone marketing landing page (separate entry, separate tree).
        landing: resolve(__dirname, "landing.html"),
      },
    },
  },
});
