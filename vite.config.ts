import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST;
const devPort = Number(process.env.FLYCAT_DEV_PORT || 1430);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": "/src"
    }
  },
  clearScreen: false,
  server: {
    port: devPort,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"]
    }
  },
  test: {
    environment: "node"
  }
});
