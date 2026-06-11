import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Build config for Vercel deployment
  build: {
    outDir:          'dist',
    sourcemap:       false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor chunks to avoid single large bundle
        manualChunks: {
          'vendor-react':  ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui':     ['react-hot-toast', 'date-fns'],
          'vendor-charts': ['recharts'],
        },
      },
    },
  },

  // Dev server
  server: {
    port: 5173,
    proxy: { '/api': 'http://localhost:5000' },
  },
})
