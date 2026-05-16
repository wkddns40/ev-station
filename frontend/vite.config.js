import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react';
          if (id.includes('node_modules/@deck.gl') || id.includes('node_modules/deck.gl')) return 'deckgl';
          if (id.includes('node_modules/maplibre-gl') || id.includes('node_modules/react-map-gl')) return 'maplibre';
          if (id.includes('node_modules/@tanstack/react-query')) return 'query';
          return undefined;
        },
      },
    },
  },
});
