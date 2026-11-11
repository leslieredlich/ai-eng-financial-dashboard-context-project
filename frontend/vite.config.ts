/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        // Local runs hit localhost; docker-compose sets API_PROXY_TARGET to the
        // backend service name, which only resolves inside the Docker network.
        target: process.env.API_PROXY_TARGET ?? "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  test: {
    // A timezone west of UTC makes date bugs (e.g. `new Date("YYYY-MM-01")`
    // landing in the previous month) reproducible on any machine, including
    // UTC containers. See .agents/rules/testing.md.
    env: { TZ: "America/Santiago" },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
