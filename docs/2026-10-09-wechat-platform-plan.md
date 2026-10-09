# 微信小程序项目唯一实施计划（Single Implementation Plan）

更新日期：2026-10-09。**项目只维护本文件作为 plan。** 运行说明、验收记录和审计报告是辅助资料或历史证据，任务范围、接口约定与上线准备事项以本文件为准。

## 1. 目标与当前范围（Goal and Scope）

使用微信原生小程序＋TypeScript、Vue 3＋Vite＋Element Plus、后续 NestJS＋Prisma＋PostgreSQL 与图片对象存储（Object Storage）。代码、测试和资源位于 `D:\work\26.10.9\all`；文档位于 `D:\work\26.10.9\docs`。

当前继续完成独立前端（Frontend），不执行上线、真实后端或跨端同步。题目、导入预览、活动与学习资源使用本地数据；示例账号、存储和 Mock 仍仅用于演示。生产准备以代码标记和本计划跟踪，**不因页面完成而认为已具备上线能力**。

用户已授权本轮实施：
- 题目编辑器（Question Editor）：选择题选项与正确答案、填空标准答案、图片选项。
- 导入预览（Import Preview）：选择 Excel、列映射、数据预览、错误定位、确认导入。
- 活动配置（Activity Settings）：开始／结束时间、IP 日限额、开启状态、选手照片与排序。
- 学习资源管理（Learning Resource Management）：字段校验、课程分类、封面、排序和启用状态。
- 统一前端契约（API Contract）和代码注释，标出上线前调整与接口联动的位置。

## 2. 工作约束（Constraints）

- Markdown 使用中文，专业术语同时标注英文；产品页面使用中文。
- 按用户指定路径原地工作，不自动提交、推送、创建工作树或委派子代理。
- 保留已有本地数据；升级数据结构时提供迁移（Migration），不把旧缓存静默当作无效数据重置。
- 四个刷题入口保留：成语填空、法律单选、农牧民图片选择题、诗词填空。
- 题目只分选择与填空；选择答案使用稳定选项 ID，填空答案使用字符串集合。
- 两端保持独立本地数据；结构对齐不代表内容已同步。
- 投票采用服务端 IP 日限额，按北京时间 04:00 切换投票日（Business Day）；不增加严格防刷、IMEI 或实名流程。
- 本轮仅保存投票配置，真实投票继续禁用；正式限额待确认。
- 图片在前端暂存为本地地址／数据 URL（Data URL）；生产图片必须经过服务端上传与引用管理。
- Excel 初版只支持 `.xlsx`，最多 10 MiB、2000 行数据、64 列；不执行公式，不解析内嵌图片。图片列暂为图片地址。
- 导入默认拒绝重复题目；可明确选择按“题型＋题干”覆盖。出现任何错误整批禁止导入，不悄悄跳过错误行。

## 3. 单一契约来源（Contract Source）

唯一类型与运行时结构约定放在 `all/shared/contracts.ts`。管理端直接使用；构建脚本同步生成小程序 `src/contracts/generated.ts`，禁止手工维护生成文件，避免跨越小程序 TypeScript 的源码根目录。

### C-01 · 题目契约（Question Contract）

`QuestionContent`：`id,type,stem,answers[],options[],explanation`。
- `type` 为 `idiom | law | image | poetry`。
- 选择题的 `answers` 只包含一个存在的选项 ID；选项是 `{id,label,image?,imageAssetId?}`。
- 填空题无选项，可填写多个接受的答案；只忽略答案前后空格。
- 图片题每个选项必须提供图片，才能启用。
- 管理写模型（Write Model）附加 `enabled,sortOrder,updatedAt`。
- 老缓存只有 `answer` 而无选项时保留原答案，生成待补全草稿；不凭空编造错误选项。
- 联动位置：共享契约、题目校验、编辑器、导入校验、小程序静态题目与答题流程、未来后端题库 DTO。

### C-02 · 首页、学习与媒体（Home / Learning / Media）

首页公开响应：`{title,subtitle,banner:{id,url}|null}`；首页写入：`{title,subtitle,bannerAssetId:null|string}`，数据库模型必须包含 `subtitle`。

词条公开模型：`id,text,pinyin,definition,example`；管理模型附加 `enabled,sortOrder`。
课程公开模型：`id,title,category,duration,url,cover?,color?,mark?`；管理模型附加 `enabled,sortOrder,coverAssetId?`。
- 正式视频 URL 使用 HTTPS；草稿可以为空，启用前必须填写。
- 正式媒体 URI、空值和图片引用规则必须在服务端与两端一起落实。
- 学习聚合接口明确返回 `{words,lessons}`，不套用分页包装；真正的分页列表使用 `{items,total,page,pageSize}`。
- 词条和选手详情通过与列表相同的数据来源读取，禁止切 HTTP 后仍查内置样本。

### C-03 · 活动、选手与时间（Activity / Candidate / Time）

活动配置：`title,startAt:null|string,endAt:null|string,dailyLimit,enabled`。
- 时间按 UTC 的 ISO 8601 保存；管理页面明确按北京时间输入和展示。
- 活动关闭时允许日期草稿；开启时必须同时有有效起止时间，结束晚于开始。
- 日期校验不得依赖客户端电脑的本地时区；正式活动有效性由服务端时钟判断。
- `dailyLimit` 必须为正整数；演示值 3 次不等于甲方正式规则。
- 每日 04:00 切换日额度，不清空累计票数或历史记录。

选手公开模型：`id,number,name,intro,color,mark,photo?`；管理模型附加 `enabled,sortOrder,votes,photoAssetId?`。排序数小者优先，同序按 ID 稳定排序；禁用项不进入正式公开列表。

### C-04 · 请求、错误和鉴权（Request / Error / Auth）

成功响应 `{data:T}`；错误响应 `{error:{code,message,requestId}}`，使用对应 HTTP 状态码。Mock 的 requestId 可省略，真实服务必须生成该字段。通用请求封装检查包装，各内容接口再校验实际 DTO，不能只使用 `as T`。

管理端真实认证由服务端完成，Cookie 使用 HttpOnly，正式 HTTPS 环境使用 Secure；页面路由守卫只负责交互。所有管理写接口必须鉴权。

## 4. 接口清单与联动（API Registry）

下表含现有 Mock 与未来后端契约；**没有后端实现的路由不能被描述为已可调用**。

| 路由 | 状态／响应 | 契约 |
| --- | --- | --- |
| GET /api/public/home | 当前 Mock；HomeContent 或 null | C-02、C-04 |
| GET /api/public/learning | 当前 Mock；聚合 {words,lessons} | C-02、C-04 |
| GET /api/public/words/:id | Mock 详情；不存在时 404，页面转为空状态 | C-02、C-04 |
| GET /api/public/voting | 当前 Mock；{title,candidates}，后续可附活动元数据 | C-03、C-04 |
| GET /api/public/candidates/:id | Mock 详情；不存在时 404 | C-03、C-04 |
| GET /api/public/questions | 后续；分页或按题型查询须明确参数 | C-01、C-04 |
| POST /api/admin/auth/login | 后续；{username,password} → 会话 Cookie | C-04、PL-01 |
| GET /api/admin/auth/me / POST logout | 后续；会话验证、撤销 | C-04、PL-01 |
| PUT /api/admin/home | 后续；包括 subtitle | C-02、C-04 |
| POST/PUT /api/admin/questions | 后续；完整 QuestionRecord，不再仅有文本 answer | C-01、C-04 |
| POST /api/admin/questions/import | 后续；重新校验、原子提交与结果报告 | C-01、PL-08 |
| POST/PUT /api/admin/words、videos、candidates | 后续；对应管理模型 | C-02、C-03、C-04 |
| PUT /api/admin/activity | 后续；ActivityConfig，时间与限额再次验证 | C-03、PL-07 |
| POST /api/admin/assets | 后续；multipart 字段 file，返回媒体元数据 | C-02、PL-04 |
| GET /api/public/assets/:id/content | 后续；按公开引用策略读取，不只考虑首页 | C-02、PL-04 |
| GET /api/health/live、ready | 后续；真实依赖检查，未就绪返回 503 | PL-05 |

## 5. 上线前代码标记（Pre-launch Markers）

代码统一使用 `[PRE-LAUNCH:PL-xx]` 标出阶段边界，使用 `[CONTRACT:C-xx]` 标出联动点。每个标记应说明要替换的行为、涉及的接口和关联文件，禁止只写含糊的“上线时修改”。

| 标记 | 上线前必须完成 | 主要代码位置 |
| --- | --- | --- |
| PL-01 | 替换演示账号／Session Storage 为真实服务端会话；接口 401 统一处理 | LoginView、stores/demo、未来 admin API 与 server auth |
| PL-02 | 替换 Local Storage、样本为数据库与服务响应；保持数据迁移与一致性 | stores/demo、seed、静态数据与 mock-transport |
| PL-03 | 发布环境配置、Mock 开关与服务地址校验；AppID／微信原生构建验收 | miniprogram/config/env、services/request、构建脚本 |
| PL-04 | 服务端图片校验、上传、HTTPS 地址、引用检查与删除规则 | AssetsView、AssetPicker、文件校验、未来存储服务 |
| PL-05 | 生产部署包、版本锁定、环境配置、迁移、健康检查和重启 | 未来 Dockerfile、Compose、反向代理、部署脚本 |
| PL-06 | 数据库／对象存储备份恢复、升级和回退演练 | 未来部署与运维脚本 |
| PL-07 | 服务端活动有效期、IP 限额、可信代理、并发事务和 04:00 边界 | VotingView、活动校验、未来 server voting |
| PL-08 | 甲方模板确认、服务端再次校验 Excel、解压限制、重复策略及原子导入 | 导入解析、ImportPreview、未来 questions/import |

上面的标记目前主要是待实施项。注释存在不代表任务关闭，必须有真实验证证据。

## 6. 实施任务与进度（Tasks and Progress）

### 已有前端基础
- [x] 两个独立前端项目、登录／布局／概览、首页配置、图片资源管理。
- [x] 四个刷题入口、选择和填空、静态题目、反馈和本地记录。
- [x] 统一请求封装、加载／空／失败／重试、配置预览和模块待配置页面。
- [x] 本地构建和 37 项基础测试；Windows 干净目录重装构建验证。
- [ ] 微信原生编译与真机验证。检测到非占位 AppID 不等于已验证运行。

### 本轮任务 1：计划、契约和标记
- [x] 将本文件更新为唯一 plan，保留审计／运行资料的定位。
- [x] 建立共享契约、生成脚本、内容 DTO 校验；修复详情静态样本断链。
- [x] 按 PL／C 编号注释当前演示边界和对应接口联动位置。
- [x] 验证生成文件一致、类型检查与相关契约测试。

### 本轮任务 2：题目编辑器
- [x] 选择题 2–8 个选项，增删时保留稳定 ID，正确答案只能选一个现有选项。
- [x] 填空题支持逐行标准答案，去除空行和重复答案。
- [x] 图片题选择库内图片或内置示例；启用前校验每个选项图片。
- [x] 表格显示解析后的标准答案；旧记录保留并迁移为完整模型或待补全草稿。
- [x] 测试选项删除／答案失效、错误输入、图片缺失及刷新保存。

### 本轮任务 3：Excel 导入预览
- [x] 使用 ExcelJS 4.4.0 读取 .xlsx；提供演示模板下载与可调整列映射。
- [x] 显示工作表、原始行号、解析题目、错误字段与统计。
- [x] 校验题型、题干、选项、答案、图片、公式与重复记录。
- [x] 全部合法后确认导入当前浏览器；默认重复拒绝，覆盖策略明确且保留旧记录 ID。
- [x] 测试真实 XLSX 文件解析、稀疏行／公式／重复／错误整批拒绝。

### 本轮任务 4：活动与学习管理
- [x] 活动起止日期、北京时间与 UTC 转换、限额与开启校验。
- [x] 选手照片、排序和启用，保留已有资料。
- [x] 词条字段校验、排序与启用；课程分类、时长、HTTPS URL、封面、排序与启用。
- [x] 正在被首页／题目／选手／课程引用的图片不能直接删除。
- [x] 通过浏览器验证所有新增交互和相关行为测试。

### 后续阶段：真实服务与部署
- [ ] NestJS 服务、Prisma 版本选择、PostgreSQL 迁移和管理员初始化。
- [ ] 真实认证、配置、题库、学习、活动、媒体与详情接口；共享契约验证。
- [ ] 公开媒体、数据库／对象存储持久化与重启验证。
- [ ] IP 日额度事务、20 并发／3 限额测试与 04:00 日期边界。
- [ ] 完整生产部署包、环境模板、固定镜像版本和构建／运行配置。
- [ ] 在目标新服务器完成首次部署、重复启动、异常配置、备份恢复及升级回退。
- [ ] 后台新增非样本 ID 记录，小程序列表与详情一致，图片外网可访问。
- [ ] 真实微信环境联调、审核与上线；未经验证不得关闭上线任务。

## 7. 本轮验证命令（Validation）

在 `all` 执行：
```powershell
pnpm typecheck
pnpm build
pnpm test
pnpm verify:mini:templates
pnpm verify:contracts
```

测试验证真实数据校验和导入行为；组件／页面用浏览器验证。生成契约在构建和类型检查前同步，独立一致性检查避免两端生成文件漂移。

当前审计报告记录的是修订前状态；后续修复结果记录在本文件和验收记录，不生成第二份实施计划。

## 8. 甲方资料与验收边界（Dependencies and Acceptance）

甲方样本到位后确认 Excel 字段映射、图片组织方式、填空判分细则、正式字典／视频、选手资料、活动日期与限额、品牌素材。保留可配置入口，不将演示模板和限额当成正式需求。

本轮只验收前端及契约准备。真实认证、服务端限额、跨端同步、全新 Linux 部署与微信真机必须分别保留待验证状态，不能由本地测试通过推断生产可用。


## 9. 本轮验证结果（Execution Evidence）

- 两端类型检查、构建、62 项自动化测试、14 个页面/18 个模板静态检查与契约一致性检查通过。
- 浏览器验证选择/图片题保存、删除正确选项后的阻断、真实 XLSX 解析和重复策略、整批导入后刷新保留、活动日期和选手照片排序、课程封面与启用校验。
- 演示模板生成并验证于 all/resources/question-import-demo.xlsx；使用 ExcelJS 4.4.0，浏览器按需加载。
- 已有缓存升级为版本 2，保留旧 ID 和图片；首次写入前保留旧缓存备份。
- 自查（Self-review）完成，未委派子代理。接口语义、编辑/导入规则、日期转换与引用检查分别有验证；发布与生产门槛仍未关闭。
- 真实后端、跨端同步、IP 限额、生产部署和微信原生/真机依旧待验证。本轮不声称具备生产上线能力。
