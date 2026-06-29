import path from "path";
import { defineConfig } from "vite-plus";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/management-api": {
        target: "http://62.103.245.63:18018",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/management-api/, ""),
      },

      "/identity-proxy-api": {
        target: "http://62.103.245.63:19005",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/identity-proxy-api/, ""),
      },
    },
  },
});
