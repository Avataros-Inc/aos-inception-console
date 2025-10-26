import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Include JSX processing for the inception-stream-component
      include: ['**/*.jsx', '**/*.js'],
    }),
    viteStaticCopy({
      targets: [
        {
          src: 'submodules/streamer/v2/public/thumbnails/*',
          dest: 'thumbnails'
        }
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      'inception-stream-component': path.resolve(import.meta.dirname, 'submodules/streamer/v2/lib/index.js'),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  optimizeDeps: {
    include: ['inception-stream-component'],
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
