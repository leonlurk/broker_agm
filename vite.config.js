import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build optimizations
  build: {
    // Code splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for dependencies
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Firebase chunk
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          // Charts chunk (large library)
          charts: ['recharts'],
          // Icons chunk
          icons: ['lucide-react', 'react-icons']
        }
      }
    },
    // Enable source maps for production debugging
    sourcemap: false, // Set to true for debugging in production
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    // Target modern browsers for smaller bundle
    target: 'esnext',
    // Chunk size warnings
    chunkSizeWarningLimit: 1000
  },
  
  // Preview server configuration
  preview: {
    port: 4173,
    headers: {
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://*.googleapis.com https://*.firebaseapp.com https://*.firebaseio.com"
    }
  },
  
  // Development server configuration
  server: {
    port: 3000,
    open: true,
    headers: {
      // Development security headers
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    }
  },
  
  // Environment variables validation
  define: {
    // Ensure environment variables are available
    __VITE_ENV__: JSON.stringify(process.env.NODE_ENV)
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore'
    ],
    exclude: ['firebase']
  },
  
  // CSS optimization
  css: {
    devSourcemap: true
  }
})
