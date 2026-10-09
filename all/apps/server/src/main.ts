import { createApp } from "./app.js";
import { readConfig } from "./config.js";
const config = readConfig();
const app = await createApp();
app.enableShutdownHooks();
await app.listen(config.port, "0.0.0.0");
console.log("首页服务已启动，端口：" + config.port);
