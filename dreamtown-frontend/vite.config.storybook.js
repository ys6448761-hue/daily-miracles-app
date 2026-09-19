import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// M4/M7 constraint: base path '/' is provisional.
// The FULL build uses base: '/dreamtown/'. The dedicated Storybook service
// base path depends on Render service URL structure — determined in M4/M7.
// Do not assume '/dreamtown/' here — that belongs to the FULL build target only.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist-storybook',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.storybook.html',
    },
  },
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:5099',
        changeOrigin: true,
      },
    },
  },
});
