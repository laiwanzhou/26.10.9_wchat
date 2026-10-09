import { readdir, copyFile, mkdir } from "node:fs/promises";
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
console.log(
  "小程序已构建：apps/miniprogram/dist；在微信开发者工具中导入 apps/miniprogram。",
);
