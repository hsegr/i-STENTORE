/// <reference types="vite-plus" />
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { loadEnv } from "vite-plus";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

const mode = process.env.MODE ?? process.env.NODE_ENV ?? "development";
const repoRoot = path.resolve(__dirname, "../..");
const clientEnv = loadEnv(mode, __dirname, "");
const rootEnv = loadEnv(mode, repoRoot, "");
const apiServerPort = rootEnv.API_SERVER_PORT || clientEnv.VITE_API_SERVER_PORT || "3000";
const clientWebPort = Number.parseInt(rootEnv.CLIENT_WEB_PORT || "8080", 10);
const apiProxyTarget = rootEnv.API_SERVER_INTERNAL_URL || `http://localhost:${apiServerPort}`;
const generateRouteTree = mode !== "test" && process.env.VITE_SKIP_ROUTE_GENERATION !== "true";

// https://vite.dev/config/
export default {
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify(clientEnv.VITE_API_BASE_URL || ""),
  },
  plugins: [
    generateRouteTree
      ? tanstackRouter({
          target: "react",
          autoCodeSplitting: true,
        })
      : undefined,
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: clientWebPort,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      "/identity-proxy-api": {
        target: "http://62.103.245.63:19005",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/identity-proxy-api/, ""),
      },
    },
  },
  preview: {
    port: clientWebPort,
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
      "/identity-proxy-api": {
        target: "http://62.103.245.63:19005",
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/identity-proxy-api/, ""),
      },
    },
  },
};
