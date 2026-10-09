# 言习平台（Yanxi Platform）

微信原生小程序与 Vue 管理网页已提供独立演示模式（Demo Mode）及首页服务模式（Service Mode）。新增 NestJS 后端（Backend）、PostgreSQL 数据库（Database）和 S3 兼容图片存储：首页与图片可真实同步，题库、学习与投票仍为本地演示。

唯一实施计划（Single Plan）位于 `../docs/2026-10-09-wechat-platform-plan.md`，真实服务启动、随机管理员初始化及小程序 HTTP 首页构建见 `../docs/development-guide.md` 第 8 节。以下普通启动说明适用于演示模式；已有 `.env` 可切换服务模式。正式服务器部署和微信真机仍待验收。

## 启动网页

在 PowerShell 中执行：

```powershell
Set-Location 'D:\work\26.10.9\all'
pnpm install --frozen-lockfile
pnpm dev
```

访问 [管理后台](http://127.0.0.1:5173)，演示账号为 `admin`，密码为 `demo2026`。这里的登录仅展示前端流程，不提供真实安全认证。

## 构建小程序

```powershell
Set-Location 'D:\work\26.10.9\all'
pnpm build:mini
```

在微信开发者工具中导入 `D:\work\26.10.9\all\apps\miniprogram`，其 `project.config.json` 指向编译产物（Build Output）`dist`。AppID 以当前项目配置为准，使用你有开发权限的有效 AppID 导入。

完整操作、范围与验证结果见 [开发运行说明](../docs/development-guide.md) 与 [前端验收记录](../docs/acceptance-checklist.md)。

项目只维护一份 [实施计划](../docs/2026-10-09-wechat-platform-plan.md)。`[PRE-LAUNCH:PL-xx]` 是上线待办标记，`[CONTRACT:C-xx]` 是接口联动标记。共享类型／解码在 `shared/contracts.ts`，执行 `pnpm verify:contracts` 检查生成契约。
