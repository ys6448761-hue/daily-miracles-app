// SOUL Practitioner Review — Dedicated preview config
// Purpose: Serve current integration/soul-cablecar-port-v0-1 SoulCableCarPage
//          on port 3002 with base:'/' so BrowserRouter (no basename) can match
//          /soul/cable-car correctly.
// Scope: Preview only. Does NOT modify main vite.config.js or production behavior.
// Launch: cd dreamtown-frontend && node ../node_modules/vite/bin/vite.js --config vite.config.soul-preview.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    port: 3002,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      // Proxy OG and canonical images from Express (public/ root, not dreamtown-frontend/public/)
      '/images/og': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
