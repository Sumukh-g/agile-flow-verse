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
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/calendar/events': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/calendar/ai': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/calendar/integrations': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/docs': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      }
    }
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react")) return "react";
            if (id.includes("@tiptap")) return "tiptap";
            if (id.includes("lucide-react")) return "icons";
            return "vendor";
          }
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
