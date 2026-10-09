import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("生产环境拒绝 HTTP 公开地址及缺少数据库配置", async () => {
  const module = await import("../dist/apps/server/src/config.js");
  assert.ok(module, "服务配置解析器尚未实现");
  assert.throws(
    () => module.readConfig({ NODE_ENV: "production" }),
    /DATABASE_URL/,
  );
  const env = {
    DATABASE_URL: "postgresql://user:pass@localhost/db",
    PUBLIC_BASE_URL: "http://example.com",
    ADMIN_ORIGIN: "https://example.com",
    S3_ENDPOINT: "http://localhost:9000",
    S3_BUCKET: "images",
    S3_ACCESS_KEY: "test",
    S3_SECRET_KEY: "test",
  };
  assert.throws(
    () => module.readConfig({ ...env, NODE_ENV: "production" }),
    /HTTPS/,
  );
  assert.equal(module.readConfig(env).cookieSecure, false);
});
test("密码哈希不包含明文且错误密码不能通过", async () => {
  const module = await import("../dist/apps/server/src/password.js");
  assert.ok(module, "密码哈希尚未实现");
  const hash = await module.hashPassword("test-password-2026");
  assert.equal(hash.includes("test-password-2026"), false);
  assert.equal(await module.verifyPassword("test-password-2026", hash), true);
  assert.equal(await module.verifyPassword("wrong", hash), false);
  assert.equal(await module.verifyPassword("wrong", "corrupt"), false);
});
test("服务端拒绝伪装图片，实际解码并生成 PNG 内容", async () => {
  const module = await import("../dist/apps/server/src/image.js");
  assert.ok(module, "图片解码尚未实现");
  await assert.rejects(module.normalizeImage(Buffer.from("<svg/>")), /图片/);
  const fixture = await readFile(
    new URL("../../miniprogram/src/assets/questions/lake.png", import.meta.url),
  );
  const image = await module.normalizeImage(fixture);
  assert.equal(image.mime, "image/png");
  assert.deepEqual(
    [...image.bytes.subarray(0, 8)],
    [137, 80, 78, 71, 13, 10, 26, 10],
  );
});
