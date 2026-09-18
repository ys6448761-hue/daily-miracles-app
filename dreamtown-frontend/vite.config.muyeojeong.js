import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// M4/M6 constraint: base path '/' is provisional.
// Final base path depends on MUYEOJEONG Render service URL structure.
// Do not assume '/dreamtown/' — that belongs to the DreamTown/Storybook runtime.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist-muyeojeong',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.muyeojeong.html',
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:5099',
        changeOrigin: true,
      },
    },
  },
});
