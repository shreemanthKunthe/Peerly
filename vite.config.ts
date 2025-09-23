import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  const apiProxy = process.env.VITE_API_PROXY;
  const useEmbeddedExpress = !apiProxy; // if proxy is provided, do not embed express
  return {
    server: {
      host: "::",
      port: 8080,
      fs: {
        allow: ["./", "./client", "./shared"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
      },
      ...(apiProxy
        ? {
            proxy: {
              "/api": {
                target: apiProxy,
                changeOrigin: true,
                secure: false,
              },
            },
          }
        : {}),
    },
    build: {
      outDir: "dist/spa",
    },
    plugins: useEmbeddedExpress ? [react(), expressPlugin()] : [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // Only apply during development (serve mode)
    async configureServer(server) {
      // Dynamically import server to avoid bundling server/** into Vite config build
      const { createServer } = await import("./server/index.ts");
      const app = createServer();

      // Add Express app as middleware to Vite dev server
      server.middlewares.use(app);
    },
  };
}
