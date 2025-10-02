import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    proxy: {
      // Proxy WebSocket endpoints to staging server for local development
      '/api/v1/livestream': {
        target: 'wss://staging-api.avataros.xyz',
        ws: true,
        changeOrigin: true,
        secure: true,
      },
      '/api/v1/ws': {
        target: 'wss://staging-api.avataros.xyz',
        ws: true,
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
