import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const proxy = 'http://localhost:3000';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/login': {
        target: proxy,
        changeOrigin: true,
      },
      '/logout': {
        target: proxy,
        changeOrigin: true,
      },
      '/ws': {
        target: proxy,
        changeOrigin: true,
        ws: true,

      },
    },
  },  
})
