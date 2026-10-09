export const frontendConfig = {
  // [PRE-LAUNCH:PL-03] 生产发布必须明确 mode=http 与 HTTPS apiBaseUrl；构建/发布检查拒绝默认 Mock。同步唯一 plan，不能靠服务器 .env 改已打包小程序。
  mode: "mock" as "mock" | "http",
  apiBaseUrl: "",
  timeoutMs: 10000,
};
