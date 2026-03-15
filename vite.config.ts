import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isDev = command === "serve";

  const plugins: PluginOption[] = [react() as PluginOption];

  return {
    server: {
      host: "::",
      port: 5173, // Moved off 8080 to accommodate the new Go Gateway
      proxy: {
        // Route all GraphQL requests to the new Go Microservices Gateway
        "/graphql": {
          target: "http://localhost:8080",
          changeOrigin: true,
          secure: false,
        },
        // Legacy REST API routing (Blue Deployment)
        "/api": {
          target: process.env.VITE_API_PROXY || "http://localhost:8082",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    build: {
      outDir: "vercel_dist",
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});
