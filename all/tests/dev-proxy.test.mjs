import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { adminConfigForEnv } from "../apps/admin/vite.config.ts";
test(
  "R-06 非默认后端端口通过真实 Vite 代理转发 API 和私有图片",
  { timeout: 20000 },
  async () => {
    const temporary = await mkdtemp(join(tmpdir(), "yanxi-proxy-test-"));
    const require = createRequire(
      new URL("../apps/admin/package.json", import.meta.url),
    );
    const { createServer: createViteServer } = await import(
      pathToFileURL(require.resolve("vite")).href
    );
    const backend = createServer((request, response) => {
      if (request.url === "/api/admin/assets/fixture/content") {
        response.setHeader("Content-Type", "image/png");
        response.end(Buffer.from([137, 80, 78, 71]));
        return;
      }
      response.setHeader("Content-Type", "application/json");
      response.end(
        JSON.stringify({
          data: { title: "proxy-fixture", cookie: request.headers.cookie },
        }),
      );
    });
    await new Promise((resolve) => backend.listen(0, "127.0.0.1", resolve));
    let vite;
    try {
      const config = adminConfigForEnv({
        PORT: String(backend.address().port),
      });
      vite = await createViteServer({
        ...config,
        configFile: false,
        root: fileURLToPath(new URL("../apps/admin", import.meta.url)),
        envDir: temporary,
        cacheDir: join(temporary, "cache"),
        logLevel: "silent",
        server: { ...config.server, host: "127.0.0.1", port: 0, watch: null },
      });
      await vite.listen();
      const base = "http://127.0.0.1:" + vite.httpServer.address().port;
      const response = await fetch(base + "/api/admin/home", {
        headers: { Cookie: "fixture-session=non-sensitive" },
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        data: {
          title: "proxy-fixture",
          cookie: "fixture-session=non-sensitive",
        },
      });
      const media = await fetch(base + "/api/admin/assets/fixture/content");
      assert.equal(media.status, 200);
      assert.equal(media.headers.get("content-type"), "image/png");
      assert.deepEqual(
        [...new Uint8Array(await media.arrayBuffer())],
        [137, 80, 78, 71],
      );
    } finally {
      await vite?.close();
      await new Promise((resolve) => backend.close(resolve));
    }
  },
);
