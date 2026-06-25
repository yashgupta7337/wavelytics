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
        // Marketing landing page — the public front door at "/".
        main: resolve(__dirname, "index.html"),
        // Dashboard console — served at "/app/".
        app: resolve(__dirname, "app/index.html"),
      },
    },
  },
});
