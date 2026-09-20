import { defineConfig } from 'vite';

export default defineConfig({
  base: '/deep-audio/',
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: 1600
  }
});
