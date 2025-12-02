import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    // FIX: Add Rollup options to split heavy libraries into separate chunks
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['@radix-ui/react-slot', 'lucide-react', 'framer-motion', 'clsx', 'tailwind-merge'],
          'charts': ['recharts'], // Heavy library, keep separate
          'supabase': ['@supabase/supabase-js'],
          'utils': ['date-fns', 'zod'] // Common utilities
        }
      }
    },
    // FIX: Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 1000,
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
});