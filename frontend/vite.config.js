import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
const proxy = 'http://localhost:3000';
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/login': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/register': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'http://localhost:3000',
        ws: true,
        changeOrigin: true,
      },
    },
  },  
})
