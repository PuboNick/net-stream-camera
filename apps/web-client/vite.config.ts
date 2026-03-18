import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 3000, fs: { allow: ['../../'] } },
  resolve: {
    alias: {
      buffer: 'buffer',
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: '../view/public',
  },
});
