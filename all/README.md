# 言习前端演示（Frontend Demo）

微信原生小程序与 Vue 管理网页分别运行，使用独立本地演示数据。当前阶段没有后端服务（Backend）、数据库（Database）或网络数据同步。

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
