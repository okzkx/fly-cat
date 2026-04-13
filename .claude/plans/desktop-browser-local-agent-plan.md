# 桌面 + 浏览器共用本机 Agent 改造计划

## Context

当前仓库的真实能力几乎全部挂在 `Tauri + Rust backend` 上：

- 前端通过 `src/utils/tauriRuntime.ts` 里的 `invoke(...)` 调用 Tauri 命令
- 设置、登录会话、任务状态等持久化都落在 `src-tauri/src/commands.rs` 维护的本地磁盘文件中
- 浏览器分支仍是 mock：`localStorage`、默认知识库列表、模拟登录、模拟任务
- 组件层存在大量 `isTauriRuntime()` 分支，导致“运行时差异”和“业务能力差异”混在一起

本次目标不是直接做“桌面 + 远程 Web 共用后端”的正式产品，而是先落一个轻量且结构清晰的中间态：

- 桌面端继续保留本机文件系统和本地同步能力
- 同一台机器上的浏览器页面也能走真实能力，而不是 mock
- 浏览器和桌面通过同一个本机 agent 共享设置、会话、任务和同步结果
- 结构上为未来“桌面 + Web 共用后端”保留平滑演进空间

## 改造目标

1. 让浏览器模式从“模拟模式”变为“正式客户端 + 本机 agent”模式
2. 让桌面端与浏览器端共享同一份本地持久化数据，而不是各自维护 `localStorage` / Tauri 文件
3. 把前端组件层从 `isTauriRuntime()` 业务分叉中解耦出来，统一依赖一层明确的应用客户端接口
4. 把 Rust 中的核心业务逻辑从 Tauri 命令壳中抽离，供 Tauri IPC 和本机 HTTP agent 共同复用
5. 为未来共享后端方案预留演进路径，但不在本次计划中引入远程服务端依赖

## 非目标

- 本次不实现“异地浏览器访问同一台机器数据”的远程多设备产品能力
- 本次不实现“桌面 + Web 共用云端后端”的正式服务端架构
- 本次不保留当前浏览器 mock 作为正式模式；mock 仅允许作为开发/测试夹具存在
- 本次不要求用户关闭桌面 UI 后浏览器仍然可用；这部分作为后续 sidecar 化选项保留

## 核心设计原则

- **组件只依赖能力接口，不感知宿主**：页面组件只知道“能否获取 bootstrap / 列树 / 启动任务”，不直接判断 `Tauri` 还是浏览器
- **传输层与业务层分离**：`Tauri IPC`、`localhost HTTP`、未来远程 HTTP 都只是 transport，核心逻辑不重复实现
- **本机 agent 先嵌入、后可拆出**：优先把 agent 作为 Tauri 进程内嵌 HTTP 服务跑通，未来再按同一协议拆成 sidecar
- **共享数据模型先稳定**：设置、会话、任务、预览、版本检查等 DTO 先收敛，再考虑更换传输方式
- **安全边界先画清楚**：local agent 仅绑定本机回环地址，写操作必须有明确的 origin / token 防护

## 目标架构

```text
                    ┌──────────────────────┐
                    │   Shared React App   │
                    │  pages / hooks / UI  │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼───────────┐
                    │   App Client Layer   │
                    │ transport-agnostic   │
                    └───────┬──────┬───────┘
                            │      │
               ┌────────────▼──┐   └──────────────┐
               │ Tauri client  │                  │
               │ invoke/event  │                  │
               └──────┬────────┘                  │
                      │                           │
               ┌──────▼────────┐          ┌──────▼─────────┐
               │ Tauri commands │          │ Local agent    │
               │ thin wrappers  │          │ HTTP localhost │
               └──────┬─────────┘          └──────┬─────────┘
                      │                           │
                      └────────────┬──────────────┘
                                   │
                        ┌──────────▼──────────┐
                        │   Rust core logic   │
                        │ settings / auth /   │
                        │ tree / tasks / sync │
                        └──────────┬──────────┘
                                   │
                        ┌──────────▼──────────┐
                        │ Shared local files  │
                        │ settings / session  │
                        │ tasks / manifest    │
                        └─────────────────────┘
```

### 关键决策

- 浏览器正式模式优先连接 `localhost` agent；连接失败时显示“请先启动桌面端/本机 agent”，而不是继续伪造成功状态
- 当前 `browserTaskManager.ts` 只保留为开发夹具，不再承担正式产品逻辑
- Tauri 命令保留，但降级为薄包装层；真正业务逻辑抽到可复用 service/core 模块
- 本机 agent 第一期嵌入 Tauri 进程，后续若需要“桌面 UI 关闭后 agent 继续存在”，再拆 sidecar

## 实施计划

### P1 - 前端运行时解耦

- [ ] T1: 定义统一的前端应用客户端接口，例如 `AppClient` / `RuntimeClient`
  - 覆盖 bootstrap、设置保存、授权、连接校验、知识库树、任务、预览、新鲜度、打开目录等能力
  - 让页面组件不再直接 import `invoke(...)` 或依赖 `Tauri` 特征位

- [ ] T2: 将 `src/utils/tauriRuntime.ts` 拆分为“能力接口 + transport 实现”
  - `tauri` transport：继续走 `invoke` / `listen`
  - `local-agent` transport：走 `fetch` / 轮询，必要时预留 SSE
  - `fixture` transport：仅 dev/test 使用，替代当前正式浏览器 mock 逻辑

- [ ] T3: 从组件层移除核心业务上的 `isTauriRuntime()` 分支
  - `src/App.tsx`
  - `src/components/AuthPage.tsx`
  - `src/components/HomePage.tsx`
  - `src/components/MarkdownPreviewPane.tsx`
  - 只允许在宿主能力边界保留极少量 UI 差异判断

- [ ] T4: 将“当前浏览器是 mock”改成“当前浏览器连接的宿主不可用”
  - 浏览器端不再展示默认知识库 / 模拟登录 / 模拟同步成功
  - agent 不可达时展示明确空态、引导和诊断信息

### P1 - Rust 业务层抽离

- [ ] T5: 把 `src-tauri/src/commands.rs` 中与 Tauri 宏无关的核心逻辑抽到独立 service/core 模块
  - 设置读写
  - 会话读写与校验
  - bootstrap 聚合
  - 知识库树加载
  - 任务读写与同步编排
  - Markdown 预览与版本检查

- [ ] T6: 保留 Tauri 命令作为薄包装
  - Tauri 命令仅负责参数反序列化、调用 service、把结果回传给前端
  - 减少 future HTTP agent 重复复制业务逻辑的风险

- [ ] T7: 收敛本地持久化访问入口
  - 统一 settings / session / tasks / freshness / manifest 的路径与读写 helper
  - 让 Tauri 命令和 local agent 访问同一套存储接口

### P1 - 嵌入式 Local Agent MVP

- [ ] T8: 在 `src-tauri` 新增本机 HTTP agent
  - 仅绑定 `127.0.0.1` / `::1`
  - 默认随桌面端进程启动
  - 提供 `/health` 或等价探针接口，便于浏览器判断 agent 可用性

- [ ] T9: 为浏览器正式模式提供第一批真实接口
  - `bootstrap`
  - `settings` 读取/保存
  - `auth` 开始/完成/注销/校验
  - `list spaces/tree`
  - `list tasks`

- [ ] T10: 浏览器端优先连接 local agent
  - 当页面运行在浏览器里时，先尝试 agent transport
  - 仅在显式开发开关下才允许回退 fixture transport
  - 默认产品行为不再无条件回退 mock

- [ ] T11: 验证桌面端与浏览器端共享同一份磁盘数据
  - 桌面保存配置后，浏览器刷新能读到
  - 浏览器完成授权后，桌面刷新 bootstrap 能读到
  - 双端任务列表来自同一份 `sync-tasks` 数据

### P2 - 浏览器正式能力补齐

- [ ] T12: 将任务写操作接入 local agent
  - 创建任务
  - 开始任务
  - 重试 / 恢复
  - 删除单个任务
  - 清空全部任务

- [ ] T13: 将知识树和同步相关的真实能力补齐到浏览器端
  - 列出真实知识库空间
  - 列出真实目录树
  - 浏览器发起真实同步，而不是本地定时器假进度

- [ ] T14: 统一任务状态观察接口
  - 前端定义 `observeTasks()` 或等价订阅接口
  - 桌面端先继续使用 Tauri event bridge
  - 浏览器端一期可先用定时轮询，后续可无痛升级到 SSE

- [ ] T15: 将预览 / 新鲜度 / 打开目录等“桌面独占能力”改造为 agent 提供
  - Markdown 预览改为浏览器通过 HTTP 请求 markdown payload
  - 文档新鲜度检查改为浏览器调用 agent 接口
  - 打开同步目录 / 打开本地文件由 agent 代为触发系统行为

### P2 - 认证与安全收口

- [ ] T16: 统一浏览器与桌面的 OAuth 主流程
  - 浏览器不再使用“模拟 code”
  - 优先把 redirect / callback 收口到 local agent 可处理的真实流程
  - 评估是否逐步下线当前桌面端对 `tauri-plugin-oauth` 的宿主专属依赖

- [ ] T17: 为 local agent 增加最小安全防护
  - 仅监听本机回环地址
  - 控制允许的 `Origin`
  - 写操作引入启动期随机 token / session token
  - 对跨站写请求进行拒绝，避免被本机浏览器中的其他站点滥用

- [ ] T18: 调整设置 DTO，避免把敏感字段暴露成必须明文回填
  - 将“已配置但不回显明文 secret”作为长期目标
  - 允许 UI 使用 `hasAppSecret` 之类的状态渲染“已配置”
  - 设置保存接口支持“仅更新非敏感字段”与“显式替换 secret”

- [ ] T19: 明确 local agent 的产品边界
  - 支持“同一台机器上的浏览器”
  - 不承诺“另一台机器访问此页面也能连到用户本机 agent”
  - 文档中明确局域网 IP 打开页面与 `localhost` 打开页面的 CORS/origin 处理策略

### P3 - 为未来共享后端方案铺路

- [ ] T20: 冻结一份 transport-agnostic 的前后端契约
  - 请求/响应 DTO 避免带 `tauri` 字样
  - 本地 agent 与未来远程 backend 尽量复用同一套语义

- [ ] T21: 将“宿主选择”与“业务能力”完全解耦
  - 前端只选择 transport，不选择业务版本
  - 未来新增 remote HTTP transport 时，不需要重写页面组件

- [ ] T22: 为 agent HTTP API 做版本化命名
  - 例如 `/api/v1/...`
  - 为未来 sidecar 化、独立部署或 remote backend 兼容保留迁移空间

- [ ] T23: 保留 sidecar 化选项
  - 若后续要求“桌面窗口关闭后浏览器仍能工作”，可把嵌入式 agent 拆成独立本机进程
  - 拆分时不应改动页面组件，只替换启动与发现逻辑

- [ ] T24: 预留 remote backend transport 的接入点
  - 可在前端保留 `remote-http` transport 插槽
  - 当前不实现，但命名、接口、错误模型不要把它堵死

## 关键文件

| 文件 | 计划修改 |
| --- | --- |
| `src/utils/tauriRuntime.ts` | 拆分为通用客户端接口与多 transport 实现，不再承载正式浏览器 mock |
| `src/utils/browserTaskManager.ts` | 从正式逻辑中退出，只保留为 dev/test fixture 或示例数据源 |
| `src/App.tsx` | 通过统一 client 获取 bootstrap / tasks / auth 状态，减少宿主判断 |
| `src/components/AuthPage.tsx` | 改为真实浏览器授权流程，不再走 mock code |
| `src/components/HomePage.tsx` | 树、任务、预览、新鲜度等统一从 client 获取 |
| `src/components/MarkdownPreviewPane.tsx` | 浏览器通过 agent 读取预览内容，不再直接以“非 Tauri 无法预览”收口 |
| `src/types/app.ts` | 收敛 bootstrap / settings / auth DTO，必要时拆出安全版设置模型 |
| `src-tauri/src/commands.rs` | 从“业务逻辑承载体”调整为“IPC 包装层” |
| `src-tauri/src/lib.rs` | 注册 agent 启动逻辑与精简后的 Tauri 命令入口 |
| `src-tauri/src/*(新增)` | 新增 core/service、local-agent、HTTP DTO、事件/轮询支撑模块 |
| `vite.config.ts` | 配合本机 agent origin 策略，补充浏览器开发模式下的 allowed origins / host 约束 |

## 验证方式

1. 启动桌面端后，在同机浏览器打开页面，确认 bootstrap 加载的是真实设置、真实用户会话、真实知识库空间
2. 在桌面端保存配置后刷新浏览器，确认自动回填一致；反向在浏览器修改配置后桌面端也能读取
3. 在浏览器端完成真实飞书授权后，桌面端刷新可看到同一会话状态
4. 在浏览器创建并启动同步任务，确认桌面端任务列表能看到同一任务及其状态变化
5. 在桌面端发起同步后，浏览器端能看到同一任务记录、同步结果和预览内容
6. 当本机 agent 未启动时，浏览器展示明确阻断态，而不是假装连上 mock 数据
7. 验证 local agent 仅监听回环地址，且对未授权 origin / token 的写操作返回拒绝

## 完成标准

- 浏览器正式模式不再依赖 `localStorage + mock 数据` 冒充真实能力
- 桌面端与浏览器端共享同一套本机持久化与同步结果
- 前端页面组件基本不再直接判断 `isTauriRuntime()` 来决定业务逻辑
- Rust 核心能力已从 Tauri IPC 包装层中抽离，可同时服务于 Tauri 和 local agent
- 本次轻量方案不会堵死未来“桌面 + Web 共用后端”的演进路径

## 开放问题

- local agent 第一期是否要求“桌面窗口关闭后仍存活”，还是接受“桌面进程存活即可”
- 任务状态订阅在第一版使用轮询还是直接上 SSE
- 设置页是否要在第一版就彻底取消明文 secret 回填，还是先接受本机受控环境下的兼容过渡
