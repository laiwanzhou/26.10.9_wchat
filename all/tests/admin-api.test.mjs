import test from "node:test";
import assert from "node:assert/strict";
test("后台真实请求发送 Cookie，非 2xx 错误不会成为本地成功", async () => {
  const module = await import("../apps/admin/src/domain/admin-client.ts").catch(
    () => null,
  );
  assert.ok(module, "后台服务客户端尚未实现");
  let sent;
  const client = module.createAdminClient(async (url, options) => {
    sent = options;
    return new Response(
      JSON.stringify({
        error: { code: "HTTP_401", message: "请登录", requestId: "test-id" },
      }),
      { status: 401 },
    );
  });
  await assert.rejects(
    client("/api/admin/home", { method: "PUT", body: { title: "x" } }),
    (error) => error.status === 401 && error.requestId === "test-id",
  );
  assert.equal(sent.credentials, "include");
  assert.equal(sent.headers["Content-Type"], "application/json");
});
test("后台拒绝错误响应包装，上传不会手写 multipart boundary", async () => {
  const module = await import("../apps/admin/src/domain/admin-client.ts").catch(
    () => null,
  );
  assert.ok(module, "后台服务客户端尚未实现");
  const bad = module.createAdminClient(async () => new Response("{}"));
  await assert.rejects(bad("/api/admin/home"), /格式/);
  let headers;
  const client = module.createAdminClient(async (url, options) => {
    headers = options.headers;
    return new Response('{"data":{"id":"a"}}');
  });
  const body = new FormData();
  body.append("file", new Blob(["fixture"]), "a.png");
  assert.deepEqual(
    await client("/api/admin/assets", { method: "POST", body }),
    { id: "a" },
  );
  assert.equal(headers["Content-Type"], undefined);
});
