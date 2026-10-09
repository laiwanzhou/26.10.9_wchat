import test from "node:test";
import assert from "node:assert/strict";
import { createMiniRuntime } from "./helpers/mini-runtime.mjs";
function settings(scenario = "normal") {
  return {
    scenario,
    title: "来自配置的首页标题",
    subtitle: "来自配置的介绍",
    banner: "lake",
  };
}
test("预览设置保存后进入首页，首页使用所选空数据场景", async () => {
  const runtime = createMiniRuntime();
  const preview = runtime.loadPage("pages/preview/index");
  preview.onLoad();
  preview.scenario({ currentTarget: { dataset: { id: "empty" } } });
  preview.save();
  assert.equal(runtime.navigations.at(-1).url, "/pages/home/index");
  const home = runtime.loadPage("pages/home/index");
  await home.onShow();
  assert.equal(home.data.status, "empty");
});
test("空首页标题不能保存预览配置或跳转", () => {
  const runtime = createMiniRuntime();
  const preview = runtime.loadPage("pages/preview/index");
  preview.onLoad();
  preview.title({ detail: { value: "" } });
  preview.save();
  assert.equal(runtime.navigations.length, 0);
  assert.equal(runtime.storage.has("yanxi-mini-preview-v1"), false);
  assert.match(runtime.toasts.at(-1).title, /标题/);
});
test("首页通过统一模拟请求显示配置文字和图片，并经历加载状态", async () => {
  const runtime = createMiniRuntime();
  runtime.storage.set("yanxi-mini-preview-v1", settings());
  const page = runtime.loadPage("pages/home/index");
  const pending = page.onShow();
  assert.equal(page.data.status, "loading");
  await pending;
  assert.equal(page.data.status, "ready");
  assert.equal(page.data.home.title, "来自配置的首页标题");
  assert.equal(page.data.home.banner.url, "/assets/questions/lake.png");
  assert.equal(runtime.networkCalls.length, 0);
});
test("首页请求失败清除旧内容，切换正常场景后可重试恢复", async () => {
  const runtime = createMiniRuntime();
  runtime.storage.set("yanxi-mini-preview-v1", settings("error"));
  const page = runtime.loadPage("pages/home/index");
  await page.onShow();
  assert.equal(page.data.status, "error");
  assert.equal(page.data.home, null);
  runtime.storage.set("yanxi-mini-preview-v1", settings());
  await page.load();
  assert.equal(page.data.status, "ready");
  assert.equal(page.data.errorMessage, "");
});
for (const path of ["home", "learning", "voting"])
  test(`${path}页面的空数据场景不显示旧示例列表`, async () => {
    const runtime = createMiniRuntime();
    runtime.storage.set("yanxi-mini-preview-v1", settings("empty"));
    const page = runtime.loadPage(`pages/${path}/index`);
    await page.onShow();
    assert.equal(page.data.status, "empty");
    if (path === "learning") assert.equal(page.data.filteredWords.length, 0);
    if (path === "voting") assert.equal(page.data.filtered.length, 0);
  });
