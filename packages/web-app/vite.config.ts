import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: ['es2022', 'chrome100', 'safari15'],
    sourcemap: 'hidden', // Using 'hidden' format instead of 'inline'
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignore sourcemap resolution warnings
        if (warning.code === 'SOURCEMAP_ERROR') return;
        // Use default for everything else
        warn(warning);
      }
    }
  },
}));
