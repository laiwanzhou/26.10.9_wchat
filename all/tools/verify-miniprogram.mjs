import { createRequire } from "node:module";
import { readFile, access } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import vm from "node:vm";
const root = resolve(import.meta.dirname, "../apps/miniprogram/dist");
const require = createRequire(
  new URL("../apps/admin/package.json", import.meta.url),
);
const { parse } = require("vue/compiler-sfc");
const config = JSON.parse(await readFile(resolve(root, "app.json"), "utf8"));
for (const page of config.pages) {
  for (const suffix of [".js", ".json", ".wxml", ".wxss"])
    await access(resolve(root, page + suffix));
}
for (const item of config.tabBar.list) {
  if (!config.pages.includes(item.pagePath))
    throw Error(`Tab 页面未注册：${item.pagePath}`);
}
const allowedTags = new Set([
  "view",
  "text",
  "button",
  "input",
  "block",
  "include",
  "radio-group",
  "radio",
  "label",
  "image",
  ...Object.keys(config.usingComponents || {}),
]);
const checked = new Set();
const visiting = new Set();
async function checkTemplate(file) {
  if (visiting.has(file)) throw Error(`模板循环引用：${file}`);
  if (checked.has(file)) return;
  visiting.add(file);
  const markup = await readFile(file, "utf8");
  const result = parse(`<template>${markup}</template>`, {
    filename: file + ".vue",
  });
  if (result.errors.length)
    throw Error(`${file}: ${result.errors.map(String).join("; ")}`);
  for (const match of markup.matchAll(/<\/?([a-z][a-z0-9-]*)\b/g)) {
    if (!allowedTags.has(match[1]))
      throw Error(`${file}: 未声明组件 ${match[1]}`);
  }
  for (const match of markup.matchAll(/\{\{([\s\S]*?)\}\}/g))
    new vm.Script(`(${match[1]})`, { filename: file });
  for (const match of markup.matchAll(/<include\s+src="([^"]+)"/g))
    await checkTemplate(resolve(dirname(file), match[1]));
  visiting.delete(file);
  checked.add(file);
}
for (const page of config.pages) {
  await checkTemplate(resolve(root, page + ".wxml"));
  JSON.parse(await readFile(resolve(root, page + ".json"), "utf8"));
}
for (const component of Object.values(config.usingComponents || {})) {
  const entry = resolve(
    root,
    component.startsWith("/") ? component.slice(1) : component,
  );
  for (const suffix of [".js", ".json", ".wxml", ".wxss"])
    await access(entry + suffix);
  const settings = JSON.parse(await readFile(entry + ".json", "utf8"));
  if (settings.component !== true)
    throw Error(`组件未声明 component:true：${entry}`);
  await checkTemplate(entry + ".wxml");
}
console.log(
  `小程序静态结构校验通过：${config.pages.length} 个页面、${checked.size} 个模板（含共享引用）的标签与表达式语法、页面配置和 Tab 路由完整。此检查不替代微信原生编译与真机运行。`,
);
