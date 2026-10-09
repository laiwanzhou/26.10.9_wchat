import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { LocalRepository } from "../apps/admin/src/domain/local-repository.ts";
import { AdminApiError } from "../apps/admin/src/domain/admin-client.ts";
import {
  createAdminServiceRuntime,
  createRouter,
  createMemoryHistory,
} from "./helpers/admin-service-runtime.mjs";
const moduleAt = async (path) => {
  const module = await import(path).catch(() => null);
  assert.ok(module, "P2 修复模块尚未实现：" + path);
  return module;
};
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

test("R-01 本地上传保存实际图片数据，刷新仓库后仍可选且不使用私有服务 URL", async () => {
  const { saveLocalImage } = await moduleAt(
    "../apps/admin/src/domain/local-asset.ts",
  );
  const raw = await readFile(
    new URL(
      "../apps/miniprogram/src/assets/questions/lake.png",
      import.meta.url,
    ),
  );
  const values = new Map();
  const storage = {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
  const repo = new LocalRepository(
    storage,
    "fixture",
    { assets: [{ id: "old" }] },
    (value) => Array.isArray(value?.assets),
  );
  const asset = await saveLocalImage(
    new File([raw], "本地示例.png", { type: "text/plain" }),
    (asset) => {
      const next = repo.read();
      next.assets.push(asset);
      repo.save(next);
      return true;
    },
  );
  const restored = new LocalRepository(
    storage,
    "fixture",
    { assets: [] },
    (value) => Array.isArray(value?.assets),
  ).read();
  assert.equal(restored.assets[0].id, "old");
  assert.equal(restored.assets[1].id, asset.id);
  assert.equal(asset.mime, "image/png");
  assert.match(asset.url, /^data:image\/png;base64,/);
  assert.deepEqual(Buffer.from(asset.url.split(",")[1], "base64"), raw);
});
test("R-01 拒绝无效图片及失败保存，不能报告已选中成功图片", async () => {
  const { saveLocalImage } = await moduleAt(
    "../apps/admin/src/domain/local-asset.ts",
  );
  let saved = false;
  await assert.rejects(
    saveLocalImage(new File(["<svg/>"], "fake.png"), () => {
      saved = true;
      return true;
    }),
    /图片/,
  );
  assert.equal(saved, false);
  const raw = await readFile(
    new URL(
      "../apps/miniprogram/src/assets/questions/lake.png",
      import.meta.url,
    ),
  );
  await assert.rejects(
    saveLocalImage(new File([raw], "good.png"), () => false),
    /保存/,
  );
});
test("R-02 上传后的新列表不被较晚返回的初次读取覆盖", async () => {
  const { createLatestLoader } = await moduleAt(
    "../apps/admin/src/domain/latest-loader.ts",
  );
  const old = deferred(),
    fresh = deferred();
  const pending = [old, fresh],
    state = {};
  const loader = createLatestLoader({
    fetch: () => pending.shift().promise,
    apply: (patch) => Object.assign(state, patch),
  });
  const first = loader.load(),
    second = loader.load();
  fresh.resolve([{ id: "uploaded" }]);
  await second;
  old.resolve([]);
  await first;
  assert.deepEqual(state.value, [{ id: "uploaded" }]);
  assert.equal(state.loading, false);
});
test("R-02 旧失败和旧 finally 不清除新 loading；卸载后不写状态", async () => {
  const { createLatestLoader } = await moduleAt(
    "../apps/admin/src/domain/latest-loader.ts",
  );
  const old = deferred(),
    fresh = deferred();
  const pending = [old, fresh],
    state = {};
  const loader = createLatestLoader({
    fetch: () => pending.shift().promise,
    apply: (patch) => Object.assign(state, patch),
  });
  const first = loader.load(),
    second = loader.load();
  old.reject(Error("旧失败"));
  await first;
  assert.equal(state.loading, true);
  assert.equal(state.errorMessage, "");
  loader.dispose();
  const snapshot = { ...state };
  fresh.resolve([{ id: "late" }]);
  await second;
  assert.deepEqual(state, snapshot);
});
test("R-03 只有 401 转登录，503 与断网阻止导航并允许后续重试", async () => {
  const { createServiceGuard } = await moduleAt(
    "../apps/admin/src/domain/session-guard.ts",
  );
  const issues = [];
  let failure = new AdminApiError(503, "暂时不可用"),
    cleared = 0;
  const guard = createServiceGuard({
    verify: async () => {
      if (failure) throw failure;
      return { username: "admin" };
    },
    unavailable: (path, message) => issues.push({ path, message }),
    clear: () => cleared++,
  });
  const route = { path: "/assets", fullPath: "/assets?filter=a" };
  assert.equal(await guard(route), false);
  assert.deepEqual(issues, [
    { path: "/assets?filter=a", message: "暂时不可用" },
  ]);
  failure = new AdminApiError(0, "网络错误");
  assert.equal(await guard(route), false);
  failure = new AdminApiError(401, "登录失效");
  assert.equal(await guard(route), "/login");
  failure = null;
  assert.equal(await guard(route), true);
  assert.ok(cleared > 0);
});
test("R-03 旧认证失败不覆盖较新的成功导航", async () => {
  const { createServiceGuard } = await moduleAt(
    "../apps/admin/src/domain/session-guard.ts",
  );
  const old = deferred(),
    fresh = deferred(),
    pending = [old, fresh],
    issues = [];
  const guard = createServiceGuard({
    verify: () => pending.shift().promise,
    unavailable: (...issue) => issues.push(issue),
    clear: () => {},
  });
  const first = guard({ path: "/assets", fullPath: "/assets" }),
    second = guard({ path: "/questions", fullPath: "/questions" });
  fresh.resolve({ username: "admin" });
  assert.equal(await second, true);
  old.reject(new AdminApiError(503, "旧故障"));
  assert.equal(await first, false);
  assert.deepEqual(issues, []);
});
test("R-06 开发代理跟随监听端口并拒绝非法端口", async () => {
  const module = await import("../apps/admin/vite.config.ts");
  assert.equal(
    typeof module.adminConfigForEnv,
    "function",
    "Vite 未提供统一端口配置",
  );
  assert.equal(
    module.adminConfigForEnv({ PORT: "3001" }).server.proxy["/api"].target,
    "http://127.0.0.1:3001",
  );
  assert.equal(
    module.adminConfigForEnv({}).server.proxy["/api"].target,
    "http://127.0.0.1:3000",
  );
  assert.throws(() => module.adminConfigForEnv({ PORT: "0" }), /PORT/);
  assert.throws(() => module.adminConfigForEnv({ PORT: "oops" }), /PORT/);
});
test("R-03 实际服务模块旧 me 401 不得经全局事件踢掉已认证的新路由", async () => {
  const { createServiceGuard } = await import(
    "../apps/admin/src/domain/session-guard.ts"
  );
  const router = createRouter({
    history: createMemoryHistory(),
    routes: ["/", "/login", "/old", "/assets", "/questions"].map((path) => ({
      path,
      component: {},
    })),
  });
  await router.push("/old");
  const old = deferred(),
    fresh = deferred(),
    started = [deferred(), deferred()],
    responses = [old, fresh];
  let calls = 0;
  const service = createAdminServiceRuntime(
    async () => {
      const pending = responses.shift();
      started[calls++].resolve();
      return pending.promise;
    },
    {
      dispatchEvent: (event) => {
        if (event.type === "yanxi-session-expired")
          void router.replace("/login");
      },
    },
  );
  const issues = [];
  router.beforeEach(
    createServiceGuard({
      verify: service.getIdentity,
      unavailable: (...issue) => issues.push(issue),
      clear: () => {},
    }),
  );
  const first = router.push("/assets");
  await started[0].promise;
  const second = router.push("/questions");
  await started[1].promise;
  fresh.resolve(new Response('{"data":{"username":"admin"}}'));
  await second;
  assert.equal(router.currentRoute.value.path, "/questions");
  old.resolve(
    new Response('{"error":{"code":"HTTP_401","message":"旧会话"}}', {
      status: 401,
    }),
  );
  await first;
  await new Promise(setImmediate);
  assert.equal(router.currentRoute.value.path, "/questions");
  assert.deepEqual(issues, []);
});
test("R-03 其他业务 API 的 401 仍发出统一会话失效通知", async () => {
  const events = [];
  const service = createAdminServiceRuntime(
    async () =>
      new Response('{"error":{"code":"HTTP_401","message":"请登录"}}', {
        status: 401,
      }),
    { dispatchEvent: (event) => events.push(event.type) },
  );
  await assert.rejects(
    service.getServiceAssets(),
    (error) => error.status === 401,
  );
  assert.deepEqual(events, ["yanxi-session-expired"]);
});
