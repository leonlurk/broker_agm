import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://62.171.177.212:8443',
        changeOrigin: true,
        secure: false, // Allow self-signed certificates in development
        rewrite: (path) => path
      }
    }
  }
})
