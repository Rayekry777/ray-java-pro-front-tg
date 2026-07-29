import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [vue()],
    resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
    server: {
      port: 5173,
      proxy: env.VITE_API_TARGET
        ? { "/api": { target: env.VITE_API_TARGET, changeOrigin: true, rewrite: (path) => path.replace(/^\/api/, "") } }
        : undefined
    },
    build: { outDir: "dist", sourcemap: false }
  };
});
