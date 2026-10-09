import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const require = createRequire(
  new URL("../apps/server/package.json", import.meta.url),
);
const result = spawnSync(
  process.execPath,
  [require.resolve("prisma/build/index.js"), "migrate", "deploy"],
  {
    cwd: resolve(import.meta.dirname, "../apps/server"),
    env: process.env,
    stdio: "inherit",
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
