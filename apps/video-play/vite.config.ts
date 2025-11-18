import react from '@vitejs/plugin-react';
import * as path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  root: __dirname,
  plugins: [react()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    fs: { allow: ['../../'] },
  },
  build: { chunkSizeWarningLimit: 2048, minify: 'esbuild', sourcemap: false, target: 'es2015' },
  resolve: {
    alias: {
      buffer: 'buffer',
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    drop: ['debugger'],
  },
});
