import type { PluginOption } from 'vite';

// A small wrapper so vite.config.ts can import this file only in dev
export function expressPlugin(): PluginOption {
  return {
    name: 'express-plugin',
    apply: 'serve', // dev only
    async configureServer(server) {
      const { createServer } = await import('./server/index.ts');
      const app = createServer();
      server.middlewares.use(app);
    },
  };
}
