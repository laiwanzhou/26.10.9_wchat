import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
const root = resolve(import.meta.dirname, "..");
const source = await readFile(resolve(root, "shared/contracts.ts"), "utf8");
const generated =
  "// 自动生成：唯一来源 all/shared/contracts.ts；禁止手工编辑。参见唯一 plan 的 C-01..C-04。\n" +
  source;
const target = resolve(root, "apps/miniprogram/src/contracts/generated.ts");
if (process.argv.includes("--check")) {
  let actual = "";
  try {
    actual = await readFile(target, "utf8");
  } catch {}
  if (actual !== generated)
    throw Error("小程序契约已漂移，请执行 node tools/sync-contracts.mjs");
  console.log("契约一致性检查通过");
} else {
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, generated);
}
