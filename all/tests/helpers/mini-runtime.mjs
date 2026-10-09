import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import vm from "node:vm";
const root = resolve(import.meta.dirname, "../../apps/miniprogram/dist");
export function createMiniRuntime(responses, config = {}) {
  let page;
  const cache = new Map(),
    storage = new Map(),
    toasts = [],
    navigations = [],
    networkCalls = [];
  const wx = {
    getStorageSync: (key) => storage.get(key),
    setStorageSync: (key, value) => storage.set(key, value),
    removeStorageSync: (key) => storage.delete(key),
    showToast: (value) => toasts.push(value),
    setNavigationBarTitle: () => {},
    redirectTo: (value) => navigations.push(value),
    navigateTo: (value) => navigations.push(value),
    switchTab: (value) => navigations.push(value),
    request: (options) => {
      networkCalls.push(options);
      if (responses) {
        if (typeof responses === "function") {
          Promise.resolve(responses(options))
            .then(options.success)
            .catch((error) => options.fail({ errMsg: error.message }));
          return;
        }
        const value = responses[new URL(options.url).pathname];
        options.success(
          value === undefined
            ? {
                statusCode: 404,
                data: { error: { code: "NOT_FOUND", message: "没有找到记录" } },
              }
            : { statusCode: 200, data: { data: value } },
        );
        return;
      }
      throw Error("测试默认不允许网络调用");
    },
  };
  const context = vm.createContext({
    wx,
    Page: (definition) => {
      page = definition;
    },
    console,
    setTimeout,
    clearTimeout,
  });
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const require = (specifier) =>
      load(resolve(dirname(file), specifier + ".js"));
    const fn = vm.runInContext(
      `(function(exports,require,module){${readFileSync(file, "utf8")}\n})`,
      context,
      { filename: file },
    );
    fn(module.exports, require, module);
    return module.exports;
  }
  function loadPage(path) {
    page = undefined;
    const file = resolve(root, path + ".js");
    cache.delete(file);
    load(file);
    page.setData = (patch) => Object.assign(page.data, patch);
    return page;
  }
  if (responses) {
    const env = load(resolve(root, "config/env.js"));
    env.frontendConfig.mode = "http";
    env.frontendConfig.apiBaseUrl = "https://test.invalid";
    Object.assign(env.frontendConfig, config);
  }
  return { loadPage, storage, toasts, navigations, networkCalls };
}
