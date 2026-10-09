import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";
import { decodeHome } from "../../../shared/contracts.ts";

test(
  "真实 HTTP：首页登录、上传、配置、权限与重启持久化",
  { timeout: 120000 },
  async (t) => {
    const module = await import("../dist/apps/server/src/app.js");
    assert.ok(module, "真实服务尚未实现");
    const { startInfrastructure } = await import(
      "../../../tools/dev-infrastructure.mjs"
    );
    const infra = await startInfrastructure({
      directory: resolve("../../.runtime/test-" + randomUUID()),
      quiet: true,
    });
    const config = {
      ...infra.env,
      PUBLIC_BASE_URL: "http://127.0.0.1:3000",
      ADMIN_ORIGIN: "http://127.0.0.1:5173",
    };
    const require = createRequire(import.meta.url);
    let app: Awaited<ReturnType<typeof module.createApp>> | undefined;
    try {
      await t.test("未执行数据库迁移时健康检查不得误报就绪", async () => {
        app = await module.createApp(config);
        await app.listen(0, "127.0.0.1");
        try {
          assert.equal(
            (await fetch((await app.getUrl()) + "/api/health/ready")).status,
            503,
          );
        } finally {
          await app.close();
          app = undefined;
        }
      });
      execFileSync(
        process.execPath,
        [require.resolve("prisma/build/index.js"), "migrate", "deploy"],
        {
          cwd: resolve("."),
          env: { ...process.env, ...config },
          stdio: "pipe",
        },
      );
      const { initializeAdmin } = await import(
        "../dist/apps/server/src/init-admin.js"
      );
      const password = randomUUID() + "-test-only";
      await initializeAdmin(config.DATABASE_URL, "test-admin", password);
      app = await module.createApp(config);
      await app.listen(0, "127.0.0.1");
      let base = await app.getUrl();
      let cookie = "";
      const request = async (
        path: string,
        method = "GET",
        body?: unknown,
        origin = config.ADMIN_ORIGIN,
      ) => {
        const headers: Record<string, string> = { Origin: origin };
        if (cookie) headers.Cookie = cookie;
        if (body && !(body instanceof FormData))
          headers["Content-Type"] = "application/json";
        return fetch(base + path, {
          method,
          headers,
          body:
            body instanceof FormData
              ? body
              : body
                ? JSON.stringify(body)
                : undefined,
        });
      };
      await t.test("未登录写入返回 401 和追踪编号", async () => {
        const response = await request("/api/admin/home", "PUT", {
          title: "非法",
          subtitle: "",
          bannerAssetId: null,
        });
        assert.equal(response.status, 401);
        assert.ok((await response.json()).error.requestId);
      });
      await t.test("错误密码被拒绝，正确密码设置 HttpOnly 会话", async () => {
        assert.equal(
          (
            await request("/api/admin/auth/login", "POST", {
              username: "test-admin",
              password: "wrong",
            })
          ).status,
          401,
        );
        const response = await request("/api/admin/auth/login", "POST", {
          username: "test-admin",
          password,
        });
        assert.equal(response.status, 200);
        assert.match(response.headers.get("set-cookie")!, /HttpOnly/);
        cookie = response.headers.get("set-cookie")!.split(";")[0];
        assert.equal((await request("/api/admin/auth/me")).status, 200);
      });
      await t.test("跨站写入和非法配置被拒绝", async () => {
        assert.equal(
          (
            await request(
              "/api/admin/home",
              "PUT",
              { title: "x", subtitle: "", bannerAssetId: null },
              "https://evil.example",
            )
          ).status,
          403,
        );
        assert.equal(
          (
            await request("/api/admin/home", "PUT", {
              title: "x",
              subtitle: "",
              bannerAssetId: "missing",
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request("/api/admin/home", "PUT", {
              title: "",
              subtitle: "",
              bannerAssetId: null,
            })
          ).status,
          400,
        );
        assert.equal(
          (
            await request("/api/admin/home", "PUT", {
              title: "x",
              subtitle: "",
              bannerAssetId: "",
            })
          ).status,
          400,
        );
      });
      await t.test("非法 JSON 和过大上传返回业务错误而非内部错误", async () => {
        const malformed = await fetch(base + "/api/admin/home", {
          method: "PUT",
          headers: {
            Origin: config.ADMIN_ORIGIN,
            Cookie: cookie,
            "Content-Type": "application/json",
          },
          body: "{invalid",
        });
        assert.equal(malformed.status, 400);
        assert.ok((await malformed.json()).error.requestId);
        const body = new FormData();
        body.append(
          "file",
          new Blob([new Uint8Array(5 * 1024 * 1024 + 1)]),
          "huge.png",
        );
        assert.equal(
          (await request("/api/admin/assets", "POST", body)).status,
          413,
        );
      });
      const bytes = await readFile(
        new URL(
          "../../miniprogram/src/assets/questions/lake.png",
          import.meta.url,
        ),
      );
      let id = "",
        url = "";
      await t.test("伪装图片被拒绝，真实图片私有预览并且尚未公开", async () => {
        const fake = new FormData();
        fake.append(
          "file",
          new Blob(["<svg/>"], { type: "image/png" }),
          "fake.png",
        );
        assert.equal(
          (await request("/api/admin/assets", "POST", fake)).status,
          400,
        );
        const body = new FormData();
        body.append(
          "file",
          new Blob([bytes], { type: "text/plain" }),
          "test.png",
        );
        const response = await request("/api/admin/assets", "POST", body);
        assert.equal(response.status, 201);
        const image = (await response.json()).data;
        id = image.id;
        url = image.url;
        assert.equal(image.mime, "image/png");
        assert.equal(image.url, "/api/admin/assets/" + id + "/content");
        assert.equal(
          (await request("/api/admin/assets/" + id + "/content")).status,
          200,
        );
        assert.equal(
          (await request("/api/public/assets/" + id + "/content")).status,
          404,
        );
      });
      await t.test(
        "保存首页后公开响应符合契约，引用中图片不可删除",
        async () => {
          const response = await request("/api/admin/home", "PUT", {
            title: "数据库中的新标题",
            subtitle: "副标题",
            bannerAssetId: id,
          });
          assert.equal(response.status, 200);
          const home = decodeHome(
            (await (await request("/api/public/home")).json()).data,
          );
          assert.equal(home!.title, "数据库中的新标题");
          assert.equal(home!.banner!.id, id);
          assert.equal(
            new URL(home!.banner!.url).pathname,
            "/api/public/assets/" + id + "/content",
          );
          const media = await request(new URL(home!.banner!.url).pathname);
          assert.equal(media.status, 200);
          assert.equal(media.headers.get("content-type"), "image/png");
          assert.equal(
            (await request("/api/admin/assets/" + id, "DELETE")).status,
            409,
          );
          assert.equal((await request("/api/health/ready")).status, 200);
        },
      );
      await t.test("小程序首页模式从真实 HTTP 服务读取新配置", async () => {
        const { createMiniRuntime } = await import(
          "../../../tests/helpers/mini-runtime.mjs"
        );
        const mini = createMiniRuntime(
          async (options: any) => {
            const response = await fetch(options.url);
            return { statusCode: response.status, data: await response.json() };
          },
          { mode: "mock", homeMode: "http", apiBaseUrl: base },
        );
        const page = mini.loadPage("pages/home/index");
        await page.onShow();
        assert.equal(page.data.status, "ready");
        assert.equal(page.data.home.title, "数据库中的新标题");
        assert.equal(page.data.home.banner.id, id);
        assert.equal(mini.networkCalls.length, 1);
      });
      await t.test(
        "后端、数据库和对象服务重启后配置、图片与会话保留",
        async () => {
          await app!.close();
          app = undefined;
          await infra.restart();
          app = await module.createApp(config);
          await app.listen(0, "127.0.0.1");
          base = await app.getUrl();
          assert.equal((await request("/api/admin/auth/me")).status, 200);
          const home = (await (await request("/api/public/home")).json()).data;
          assert.equal(home.title, "数据库中的新标题");
          assert.equal(home.banner.id, id);
          assert.equal(
            (await request("/api/public/assets/" + id + "/content")).status,
            200,
          );
        },
      );
      await t.test("退出撤销服务端会话，旧 Cookie 无法继续使用", async () => {
        assert.equal(
          (await request("/api/admin/auth/logout", "POST")).status,
          200,
        );
        assert.equal((await request("/api/admin/auth/me")).status, 401);
      });
      await t.test(
        "解除首页引用后图片可删除，数据库与公开接口均不再暴露",
        async () => {
          const login = await request("/api/admin/auth/login", "POST", {
            username: "test-admin",
            password,
          });
          cookie = login.headers.get("set-cookie")!.split(";")[0];
          assert.equal(
            (
              await request("/api/admin/home", "PUT", {
                title: "文字首页",
                subtitle: "",
                bannerAssetId: null,
              })
            ).status,
            200,
          );
          assert.equal(
            (await request("/api/admin/assets/" + id, "DELETE")).status,
            200,
          );
          assert.equal(
            (await request("/api/admin/assets/" + id + "/content")).status,
            404,
          );
          assert.equal(
            (await request("/api/public/assets/" + id + "/content")).status,
            404,
          );
          assert.equal(
            (await (await request("/api/admin/assets")).json()).data.items
              .length,
            0,
          );
        },
      );
    } finally {
      await app?.close();
      await infra.stop();
    }
  },
);
