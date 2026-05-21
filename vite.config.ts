import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { defineConfig, splitVendorChunkPlugin } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    proxy: {
      '/v1': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/docs': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  optimizeDeps: {
    // Exclude packages that should not be pre-bundled
    exclude: ['@sentry/react'],
    
    // Include packages that benefit from pre-bundling
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'axios',
      'date-fns',
    ],
    
    // Force optimization of specific packages
    force: false, // Set to true to force re-optimization
  },
  plugins: [
    react(),
    splitVendorChunkPlugin(),
    visualizer({
      filename: "dist/stats.html",
      gzipSize: true,
      template: "treemap",
    }),
  ],
  build: {
    // Target modern browsers for smaller bundles
    target: 'esnext',
    
    // Minify with terser for better compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
    },
    
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for optimal loading
        manualChunks(id) {
          // React core - critical, load first
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react-core';
          }
          
          // React Router - critical for navigation
          if (id.includes('node_modules/react-router')) {
            return 'react-router';
          }
          
          // React Query - data fetching
          if (id.includes('node_modules/@tanstack/react-query')) {
            return 'react-query';
          }
          
          // UI libraries - large, load separately
          if (id.includes('node_modules/@radix-ui')) {
            return 'radix-ui';
          }
          
          // Chart library - heavy, load on-demand
          if (id.includes('node_modules/recharts')) {
            return 'charts';
          }
          
          // Icons - can be large
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          
          // Date utilities
          if (id.includes('node_modules/date-fns')) {
            return 'date-utils';
          }
          
          // Rich text editor (if used)
          if (id.includes('node_modules/@tiptap')) {
            return 'tiptap';
          }
          
          // Socket.io - real-time features
          if (id.includes('node_modules/socket.io')) {
            return 'socket';
          }
          
          // Axios - HTTP client
          if (id.includes('node_modules/axios')) {
            return 'axios';
          }
          
          // Other vendor code
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        
        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    
    // Source maps for production debugging (optional)
    sourcemap: false, // Set to true if you need source maps in production
    
    // Chunk size warnings
    chunkSizeWarningLimit: 1000, // Warn if chunk exceeds 1MB
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
