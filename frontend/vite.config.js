// frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Aici este magia!
    port: 80,
    host: true,
    proxy: {
      // Orice cerere care începe cu '/api'
      '/api': {
        // va fi redirecționată către serverul tău de backend
        target: 'http://localhost:3000',
        // Schimbă originea cererii pentru a evita probleme de CORS
        changeOrigin: true,
      },
    }
  }
})