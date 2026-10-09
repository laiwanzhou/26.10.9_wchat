import test from "node:test";
import assert from "node:assert/strict";
import { createRequestClient } from "../apps/miniprogram/src/domain/request-client.ts";
import { createResourceLoader } from "../apps/miniprogram/src/domain/resource.ts";

test("统一请求读取 data 包装，支持列表和空结果", async () => {
  const request = createRequestClient(async () => ({
    statusCode: 200,
    data: { data: [{ title: "首页配置" }] },
  }));
  assert.deepEqual(await request({ path: "/api/public/home" }), [
    { title: "首页配置" },
  ]);
  const empty = createRequestClient(async () => ({
    statusCode: 200,
    data: { data: null },
  }));
  assert.equal(await empty({ path: "/api/public/home" }), null);
});
test("HTTP 错误保留业务错误码和请求编号", async () => {
  const request = createRequestClient(async () => ({
    statusCode: 401,
    data: {
      error: { code: "UNAUTHORIZED", message: "登录已失效", requestId: "r1" },
    },
  }));
  await assert.rejects(
    request({ path: "/api/test" }),
    (error) =>
      error.code === "UNAUTHORIZED" &&
      error.message === "登录已失效" &&
      error.requestId === "r1",
  );
});
test("无 data 包装的成功响应不能误报成功", async () => {
  const request = createRequestClient(async () => ({
    statusCode: 200,
    data: { unexpected: true },
  }));
  await assert.rejects(
    request({ path: "/api/test" }),
    (error) => error.code === "INVALID_RESPONSE",
  );
});
test("网络异常归一化为可展示的错误", async () => {
  const request = createRequestClient(async () => {
    throw Error("transport failed");
  });
  await assert.rejects(
    request({ path: "/api/test" }),
    (error) => error.code === "NETWORK_ERROR" && error.message.includes("网络"),
  );
});
test("未完成的请求到期返回超时错误", async () => {
  const request = createRequestClient(() => new Promise(() => {}), 5);
  await assert.rejects(
    request({ path: "/api/test" }),
    (error) => error.code === "REQUEST_TIMEOUT",
  );
});
test("资源加载显示 loading，完成后进入 ready", async () => {
  const states = [];
  const load = createResourceLoader({
    fetch: async () => ["词条"],
    isEmpty: (value) => value.length === 0,
    apply: (state) => states.push(state),
  });
  await load();
  assert.deepEqual(
    states.map((s) => s.status),
    ["loading", "ready"],
  );
  assert.deepEqual(states.at(-1).data, ["词条"]);
});
test("资源空结果与失败状态可区分，失败后可重试", async () => {
  const states = [];
  let attempts = 0;
  const load = createResourceLoader({
    fetch: async () => {
      if (++attempts === 1) throw Error("加载失败");
      return [];
    },
    isEmpty: (value) => value.length === 0,
    apply: (state) => states.push(state),
  });
  await load();
  assert.equal(states.at(-1).status, "error");
  assert.equal(states.at(-1).errorMessage, "加载失败");
  await load();
  assert.equal(states.at(-1).status, "empty");
  assert.equal(states.at(-1).errorMessage, "");
});
test("旧请求迟到时不能覆盖后一次请求的内容", async () => {
  let release;
  let calls = 0;
  const states = [];
  const load = createResourceLoader({
    fetch: () =>
      ++calls === 1
        ? new Promise((resolve) => {
            release = resolve;
          })
        : Promise.resolve(["新内容"]),
    isEmpty: () => false,
    apply: (state) => states.push(state),
  });
  const first = load();
  await load();
  release(["旧内容"]);
  await first;
  assert.deepEqual(states.at(-1).data, ["新内容"]);
  assert.equal(states.filter((s) => s.status === "ready").length, 1);
});
