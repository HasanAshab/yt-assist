import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Core React libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // Router library
            if (id.includes('react-router-dom')) {
              return 'vendor-router';
            }
            // Supabase client
            if (id.includes('@supabase/supabase-js')) {
              return 'vendor-supabase';
            }
            // Other vendor libraries
            return 'vendor-misc';
          }
          
          // App-specific chunks
          if (id.includes('/components/content/')) {
            return 'content-components';
          }
          if (id.includes('/components/tasks/')) {
            return 'task-components';
          }
          if (id.includes('/components/dashboard/')) {
            return 'dashboard-components';
          }
          if (id.includes('/services/')) {
            return 'services';
          }
        },
      },
    },
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
  },
})
