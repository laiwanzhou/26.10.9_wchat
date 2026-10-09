import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath } from "node:url";
const envDir = fileURLToPath(new URL("../..", import.meta.url));
// [PRE-LAUNCH:PL-03/PL-05] 开发代理跟随后端 PORT；公开图片地址仍须在 PUBLIC_BASE_URL 同步配置，生产使用同源反向代理。
export function adminConfigForEnv(env: Record<string, string | undefined>) {
  const port = Number(env.PORT || 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw Error("PORT 必须是有效服务端口");
  return {
    plugins: [vue()],
    envDir,
    server: {
      port: 5173,
      strictPort: true,
      proxy: {
        "/api": { target: `http://127.0.0.1:${port}`, changeOrigin: false },
      },
    },
    build: { chunkSizeWarningLimit: 1000 },
  };
}
export default defineConfig(({ mode }) =>
  adminConfigForEnv(loadEnv(mode, envDir, "")),
);
