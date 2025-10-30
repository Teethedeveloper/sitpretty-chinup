// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import eslint from 'vite-plugin-eslint';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: '.', // frontend folder as root
  plugins: [react(), eslint()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // @ -> src
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        // Inject global.scss into all SCSS files
       //additionalData: `@use "@/src/styles/_Variables.scss" as *;`,*
      },
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 1000,
    },
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "script-src 'self' 'unsafe-inline' 'unsafe-eval';",
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log(`Proxy response headers for ${req.url}:`, proxyRes.headers);
          });
          proxy.on('error', (err, req) => {
            console.error(`Proxy error for ${req.url}:`, err);
          });
        },
      },
    },
  },
});









