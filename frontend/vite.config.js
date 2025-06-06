import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router']
        }
      }
    }
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["frontend","frontend-production-9900.up.railway.app"],
    preview: {
      host: "0.0.0.0",
      allowedHosts: ["frontend","frontend-production-9900.up.railway.app"],
    },
  },
});
