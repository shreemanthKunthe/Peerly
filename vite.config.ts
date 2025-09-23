import { defineConfig, type PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ command }) => {
  const apiProxy = process.env.VITE_API_PROXY;
  const isDev = command === "serve";
  const useEmbeddedExpress = isDev && !apiProxy; // only embed express during dev serve

  const plugins: PluginOption[] = [react() as PluginOption];
  if (useEmbeddedExpress) {
    // Load from a separate file in dev only to avoid any reference to server/** in build
    const { expressPlugin } = await import("./vite.express-plugin");
    plugins.push(expressPlugin());
  }

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
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});
