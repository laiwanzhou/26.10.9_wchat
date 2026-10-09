# 微信小程序项目唯一实施计划（Single Implementation Plan）

更新日期：2026-10-10。**项目只维护本文件作为 plan。** 运行说明、验收记录和审计报告是辅助资料或历史证据，任务范围、接口约定与上线准备事项以本文件为准。

## 1. 目标与当前范围（Goal and Scope）

使用微信原生小程序＋TypeScript、Vue 3＋Vite＋Element Plus、后续 NestJS＋Prisma＋PostgreSQL 与图片对象存储（Object Storage）。代码、测试和资源位于 `D:\work\26.10.9\all`；文档位于 `D:\work\26.10.9\docs`。

当前已获用户授权推进首页完整流程（End-to-end Flow）：真实管理登录 → 首页配置 → 图片上传 → 数据库存储 → 小程序读取，并先将已有代码推送到用户仓库。题库、导入、学习与投票继续保留本地演示。此次不执行正式上线，**不因流程完成而认为全平台已具备上线能力**。

用户已授权本轮实施：
- 题目编辑器（Question Editor）：选择题选项与正确答案、填空标准答案、图片选项。
- 导入预览（Import Preview）：选择 Excel、列映射、数据预览、错误定位、确认导入。
- 活动配置（Activity Settings）：开始／结束时间、IP 日限额、开启状态、选手照片与排序。
- 学习资源管理（Learning Resource Management）：字段校验、课程分类、封面、排序和启用状态。
- 统一前端契约（API Contract）和代码注释，标出上线前调整与接口联动的位置。

## 2. 工作约束（Constraints）

- Markdown 使用中文，专业术语同时标注英文；产品页面使用中文。
- 按用户指定路径原地工作；用户已明确授权提交并推送到 `https://github.com/laiwanzhou/26.10.9_wchat`。不创建工作树；用户最新明确授权本轮独立子智能体只读复审，后续委派仍按授权范围。依赖、构建产物、私有配置、密钥与审计缓存不得入库。
- 保留已有本地数据；升级数据结构时提供迁移（Migration），不把旧缓存静默当作无效数据重置。
- 四个刷题入口保留：成语填空、法律单选、农牧民图片选择题、诗词填空。
- 题目只分选择与填空；选择答案使用稳定选项 ID，填空答案使用字符串集合。
- 首页与图片在服务模式（Service Mode）通过真实后端同步；演示模式和其余模块保持独立本地数据，不把结构对齐当作全模块内容同步。
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


## 9. 上一轮前端验证结果（Previous Frontend Evidence）

- 两端类型检查、构建、62 项自动化测试、14 个页面/18 个模板静态检查与契约一致性检查通过。
- 浏览器验证选择/图片题保存、删除正确选项后的阻断、真实 XLSX 解析和重复策略、整批导入后刷新保留、活动日期和选手照片排序、课程封面与启用校验。
- 演示模板生成并验证于 all/resources/question-import-demo.xlsx；使用 ExcelJS 4.4.0，浏览器按需加载。
- 已有缓存升级为版本 2，保留旧 ID 和图片；首次写入前保留旧缓存备份。
- 自查（Self-review）完成，未委派子代理。接口语义、编辑/导入规则、日期转换与引用检查分别有验证；发布与生产门槛仍未关闭。
- 真实后端、跨端同步、IP 限额、生产部署和微信原生/真机依旧待验证。本轮不声称具备生产上线能力。

## 10. 首页真实流程实施（Home Service Flow）

本节是用户新授权阶段的设计与实施任务，仍属于本文件唯一 plan。第 9 节是上一轮历史证据，不用于证明本阶段已完成。

### 设计与范围（Design and Scope）

- `apps/server`：NestJS HTTP 服务；Prisma 6 与 PostgreSQL 保存管理员、哈希会话、首页单例和图片元数据。使用显式数据库迁移，不在启动时破坏性同步结构。
- 管理员通过环境配置初始化，不内置正式密码；密码使用 scrypt 哈希。登录生成随机会话，数据库仅保存令牌哈希；Cookie 为 HttpOnly、SameSite=Lax，生产必须 Secure。写操作验证 Origin 防止跨站请求伪造（CSRF），登录有基础尝试限额。
- 图片上传使用 multipart 字段 `file`，仅 JPEG/PNG/WebP、最大 5 MiB；服务端实际解码、限制像素并重新编码，忽略客户端 MIME。S3 兼容对象存储保存内容，数据库保存 ID 与对象键。
- 私有图片通过管理接口预览；公开内容接口仅允许当前首页引用的图片。设置首页和删除图片通过事务及锁协调，禁止删除被引用图片。响应 URL 从明确配置的公开服务地址生成，不信任 Host 或上传文件名。
- 管理端通过显式模式开关保留演示；服务模式的登录、首页与图片使用真实 API，其余模块明确标明仍为本地演示。禁止连接失败时静默回退到本地保存。
- 管理网页使用同源 `/api` 代理；私有预览返回 `/api/admin/assets/:id/content` 相对地址，公开图片使用 `PUBLIC_BASE_URL` 生成绝对地址，支持首页在局域网设备试验。
- 小程序增加可独立启用的首页 HTTP 模式；其余资源保持 Mock，便于本阶段试验。发布配置与本地试验配置分离，生产要求 HTTPS，服务配置不会由服务端自动改变已打包的小程序。
- 保持 C-02、C-04 单一契约来源；补充 HomeConfig、AdminIdentity 与媒体响应的运行时解码。当前公开首页接口返回配置或 null。

### 新增接口（Additional APIs）

| 路由 | 语义 |
| --- | --- |
| POST /api/admin/auth/login | 校验账号密码、设置会话；响应 `{data:{username}}` |
| GET /api/admin/auth/me | 验证真实会话并返回身份；未登录 401 |
| POST /api/admin/auth/logout | 撤销会话并清除 Cookie |
| GET /api/admin/home、PUT /api/admin/home | 读取／保存 `{title,subtitle,bannerAssetId}`；服务端长度与图片引用校验 |
| GET /api/admin/assets、POST /api/admin/assets | 列表／上传返回共享 ImageAsset，列表使用 `{items}` |
| GET /api/admin/assets/:id/content | 需登录的图片预览 |
| DELETE /api/admin/assets/:id | 未引用图片删除；引用中 409 |
| GET /api/public/home | 当前首页配置；banner URL 指向公开媒体接口 |
| GET /api/public/assets/:id/content | 仅首页公开引用的图片；其余 404 |
| GET /api/health/live、ready | 进程存活；就绪检查 PostgreSQL 与存储，失败 503 |

### 实施顺序与验收（Implementation and Acceptance）

- [x] S0：建立 Git 基线并推送用户仓库，提交 `c477430`。
- [x] S1：服务配置、共享契约、数据库迁移、管理员初始化、会话与错误处理；测试错误密码、未登录写入、退出撤销和 CSRF。
- [x] S2：真实图片上传、解码、私有／公开访问、首页保存和引用删除保护；测试伪造文件、缺失引用、事务与非样本 ID。
- [x] S3：后台服务模式的登录／首页／图片及小程序首页 HTTP 模式；错误状态与 401 不回退本地；保留已有缓存。
- [x] S4：已提供开发工具、容器配置、环境模板与 Linux 自动检查工作流；实测本地数据库迁移、HTTP 与重启持久化。CI 执行结果与目标服务器另行记录。
- [x] S5：类型检查、构建、原有测试、真实服务集成测试、模板／契约检查；自查、更新验收和交接。实现提交 `b10ffc9` 已推送，Linux CI 通过，补充文档提交随后推送。

服务器部署和微信真机是否完成必须单独记录；没有环境或证据不得勾选。使用本地实际 PostgreSQL 与 S3 兼容测试服务的结果，只证明相应环境，不能替代目标服务器验收。正式题库、投票、学习后端不属于本轮范围。

### 当前验证与剩余边界（Current Evidence and Boundaries）

- 本阶段本机类型检查、构建、64 项前端测试＋15 项服务端测试（共 79 项）、14 页面／18 模板和共享契约检查通过。服务端测试运行实际 PostgreSQL 与 S3 兼容测试服务，包含未迁移时 503、Cookie 会话、CSRF、过大／伪装上传、私有与公开访问、引用删除、真实 HTTP 小程序首页和三服务重启持久化。
- 浏览器实测真实登录、上传图片正常显示、首页保存和刷新读取；截图 `docs/home-service-preview.png`。测试使用合成配置，保留本地旧缓存。
- Compose 配置解析通过；本机 Docker 引擎不可用，未声称本机镜像构建或目标服务器运行成功。[Linux CI 第 1 次运行](https://github.com/laiwanzhou/26.10.9_wchat/actions/runs/37947030759) 已通过，包括干净安装、类型检查、构建、79 项测试、模板／契约及 Docker 镜像构建。
- 自查（Self-review）已核对会话、接口包装、图片权限、引用事务、配置与产物路径；修复空图片 ID 的数据库错误及未迁移时就绪误报。按项目约束未委派子代理。
- PL-01：当前登录限速器只覆盖单进程，多副本需共享限速与代理验证；PL-04：正式存储提供商兼容性、访问控制及上传回滚失败后的孤立对象清理需验收。
- PL-03、PL-05、PL-06：HTTPS／微信域名、真机、目标服务器运行、备份恢复、升级回退仍待验证。正式投票、题库、学习后端保持未完成状态。
- 本机仅用于浏览器验收的临时管理员已退出并移除；首次生成的管理员与 `.env` 密码保留。小程序当前本机 `dist` 已构建为首页 HTTP 试验模式，源码默认与普通构建仍为 Mock。
- 实施资料参考：[NestJS 认证文档](https://docs.nestjs.com/security/authentication)、[Prisma 数据库连接文档](https://www.prisma.io/docs/orm/prisma-client/setup-and-configuration/databases-connections)、[S3 对象文档](https://docs.aws.amazon.com/AmazonS3/latest/userguide/UsingObjects.html)。实际实现和固定版本以仓库为准。

## 11. 独立复审与待修复项（Independent Review Follow-ups）

用户已授权三个独立子智能体分别只读复审服务端、前端及部署／契约。原审查版本为 `f8d750c`，证据见[独立复审报告](D:/work/26.10.9/docs/2026-10-09-independent-review.md)；报告不是第二份 plan。原复审阶段不修改业务代码，最新授权的 P2 修复与结果记录如下；不把 CI 通过当作所有异常边界通过。

未发现已证实的 P0／P1；确认 6 项 P2、3 项 P3。第 10 节的实现与已有验证证据保留，但需要完成以下修复和相应回归验证才能关闭复审缺陷：

- [x] R-01／P2：保留服务模式下演示编辑器的本地自定义图片上传／选择链路，明确服务与本地图片库边界（PL-02、PL-04）。
- [x] R-02／P2：图片列表加入请求代次保护，验证旧读取／失败不覆盖上传、删除或新重试的结果（C-02、C-04）。
- [x] R-03／P2：认证守卫区分 401 与网络／503，故障可重试且不放行未经确认的导航（C-04、PL-01）；旧 me 的 401 不先派发全局事件。
- [x] R-04／P2：对象清理逐项隔离失败，并避免固定批次失败项饿死后续任务；验证重启与批次边界（PL-04）。
- [x] R-05／P2：大 JSON 等已知解析异常返回正确 HTTP 状态码与追踪编号（C-04）。
- [x] R-06／P2：开发网页代理与可配置服务端口对齐，验证非默认端口（PL-03、PL-05）。
- [ ] R-07／P3：服务图片使用中标签读取真实首页引用。
- [ ] R-08／P3：明确开发初始化遇到空密码配置的处理，保留既有非空密码与管理员数据。
- [ ] R-09／P3：协调第 6 节旧待办与第 10 节首页完成范围，不把未验收的全平台／生产范围标为完成。

本节记录复审事项；用户最新已授权先修复 R-01..R-06 六项 P2。P3 保持待处理。具体复现、位置和建议在报告记录，实施与状态仍以本文件为准。

### P2 修复执行记录（Fix Execution Record）

本轮沿用当前目录与唯一 plan，不创建工作树或第二份计划。现有复审报告和计划修改保留；业务与浏览器数据不得重置。

- R-01：在已有 AssetPicker 增加明确标注的本地演示上传入口，共用本地媒体校验／保存逻辑；仅在保存成功后选择新图，服务首页继续只选真实服务图片。
- R-02：管理端图片读取使用请求代次保护，涵盖旧成功、旧失败、loading 和卸载；不因慢请求回退列表。
- R-03：服务路由守卫仅在 401 跳转登录；其他故障阻止新导航并展示全局可重试提示，保留当前页面与未保存表单。
- R-04：对象清理按稳定键分批推进，失败逐项保留且不阻塞其他项；单轮限制 100 项，后续轮次推进，重启从头重试，避免全量扫描或固定坏批次饥饿。
- R-05：显式识别 JSON 解析器的已知客户端异常并返回正确状态，不把任意异常的 status 当作可信状态。
- R-06：Vite 从项目环境读取后端 PORT 生成本地代理目标；保留同源访问与私有图片路径，验证 3001 等非默认端口。

每项先运行能暴露缺陷的测试，再实现并验证。最终执行原有全套检查和相关页面验收，记录实际结果；不把 P2 修复等同于生产上线验收。代码完成后进行只读修复复核，仍属于已授权的独立复审范围。

### P2 修复验证结果（Fix Evidence）

- 已运行 RED→GREEN 回归：本地图片数据持久化／保存失败、图片旧响应／旧错误与卸载、非 401 导航与重试、对象单项失败／超过 100 条／重建 worker、实际删除接口、70 KiB JSON、非默认端口真实 Vite API／私有图片代理。
- 独立只读修复复核确认五项及 R-03 基础路径，指出旧 me 401 全局事件绕过代次保护。已在同一修复轮次纠正，并用真实客户端、实际服务模块、Vue Router 内存路由的接线级测试证明旧行为跳登录、新行为保留已认证页面；其他业务 API 的 401 通知仍有效。该补修以失败后通过的回归验证，不声称进行第二次独立复核。
- 当前类型检查、构建、74 项前端＋19 项服务端测试（共 93 项）、14 页面／18 模板与契约检查通过。预期故障测试会打印保留清理记录的日志；没有失败测试。
- 修复实现已提交并推送为 `0cf40d7`，2026-10-10（北京时间）确认[Linux CI](https://github.com/laiwanzhou/26.10.9_wchat/actions/runs/37957344260) 全部通过，包含干净安装、93 项测试和 Docker 镜像构建。目标服务器运行与生产验收仍未完成。
- 浏览器已验证服务模式中的本地选手照片上传、选中和 Data URL 预览；取消新增保留原选手。断线时保留当前首页与未保存输入，服务恢复后重试可进入页面；首次导航故障后重试也可恢复。合成图片保留在本地演示库，正式数据没有重置。
- 截图证据：`docs/p2-local-image-preview.png`、`docs/p2-connection-retry-preview.png`。开发服务验证后恢复；验收临时账号退出并移除，原管理员与缓存保留。
- 本轮未增加数据库字段或破坏性迁移。P3 三项保持待处理；实际生产存储、目标服务器运行、HTTPS、备份／回退与微信真机仍按既有边界待验收。
