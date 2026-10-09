import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import vm from "node:vm";
import * as client from "../../apps/admin/src/domain/admin-client.ts";
import * as contracts from "../../shared/contracts.ts";
const adminRequire = createRequire(
  new URL("../../apps/admin/package.json", import.meta.url),
);
const ts = adminRequire("typescript");
export const { createRouter, createMemoryHistory } = adminRequire("vue-router");
// 执行真实服务模块；仅替换 Vite 编译环境及网络/浏览器事件边界，不复制 API 或守卫逻辑。
export function createAdminServiceRuntime(fetch, window) {
  const source = readFileSync(
    new URL("../../apps/admin/src/services/platform.ts", import.meta.url),
    "utf8",
  ).replaceAll("import.meta.env", "testEnv");
  const code = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (specifier) => {
      if (specifier === "../domain/admin-client") return client;
      if (specifier === "../../../../shared/contracts") return contracts;
      throw Error("未配置的测试模块：" + specifier);
    },
    fetch,
    window,
    testEnv: { VITE_ADMIN_MODE: "service" },
    FormData,
    AbortSignal,
    Event,
    console,
  });
  return module.exports;
}
