import { readdir, copyFile, mkdir, appendFile } from "node:fs/promises";
import { resolve, join, extname } from "node:path";
const root = resolve(import.meta.dirname, "../apps/miniprogram");
// [PRE-LAUNCH:PL-03/PL-05] 当前仅生成前端产物；生产流水线仍须检查 Mock 开关/AppID/HTTPS 地址，执行微信原生编译并从干净目录构建。
async function copyStatic(from, to) {
  await mkdir(to, { recursive: true });
  for (const entry of await readdir(from, { withFileTypes: true })) {
    const source = join(from, entry.name),
      target = join(to, entry.name);
    if (entry.isDirectory()) await copyStatic(source, target);
    else if (
      [".json", ".wxml", ".wxss", ".png", ".jpg"].includes(extname(entry.name))
    )
      await copyFile(source, target);
  }
}
await copyStatic(join(root, "src"), join(root, "dist"));
// [PRE-LAUNCH:PL-03] 配置写入构建产物，不改写用户源码或 AppID；发布时必须完成其余模块和原生验收。
const homeMode = process.env.MINI_HOME_MODE || "mock";
if (!["mock", "http"].includes(homeMode))
  throw Error("MINI_HOME_MODE 必须为 mock/http");
if (homeMode === "http") {
  const url = new URL(process.env.MINI_API_BASE_URL || "");
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.pathname !== "/" ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw Error("MINI_API_BASE_URL 必须为 HTTP/HTTPS Origin");
  if (process.env.MINI_RELEASE === "true")
    throw Error("当前只有首页接入，禁止将本阶段试验包作为完整正式发布包");
  await appendFile(
    join(root, "dist/config/env.js"),
    '\nexports.frontendConfig.homeMode = "http";\nexports.frontendConfig.apiBaseUrl = ' +
      JSON.stringify(url.origin) +
      ";\n",
  );
} else if (process.env.MINI_RELEASE === "true")
  throw Error("正式发布不能使用 Mock");
console.log(
  "小程序已构建：apps/miniprogram/dist；在微信开发者工具中导入 apps/miniprogram。",
);
