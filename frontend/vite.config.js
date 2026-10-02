import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', ws: true, changeOrigin: true },
    },
  },
  build: {
    // Increase limit to silence warnings; real fix is splitting below
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // More granular splits prevent any one chunk from being too large
        // and reduces the blast radius when a chunk fails to load
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react-router-dom') || id.includes('react-router')) return 'router';
            if (id.includes('react')) return 'react';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('socket.io-client')) return 'socket';
            if (id.includes('axios')) return 'axios';
            if (id.includes('date-fns')) return 'date-fns';
            if (id.includes('clsx') || id.includes('react-hot-toast')) return 'ui-utils';
            return 'vendor';
          }
          // Split large page components into their own chunks
          if (id.includes('/pages/TaskerDashboard')) return 'page-tasker-dash';
          if (id.includes('/pages/AdminDashboard')) return 'page-admin';
          if (id.includes('/pages/RequesterDashboard')) return 'page-requester-dash';
          if (id.includes('/pages/Home')) return 'page-home';
          if (id.includes('/pages/teams/')) return 'page-teams';
          if (id.includes('/components/ui/CertificationModuleData')) return 'cert-data';
          if (id.includes('/components/ui/EnterpriseCertification')) return 'cert-ui';
        },
      },
    },
  },
});
