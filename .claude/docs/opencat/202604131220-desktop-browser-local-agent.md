## 基本信息

- 变更名称：`desktop-browser-local-agent`
- 执行模式：`worktree`
- 基线分支：`master`
- 任务分支：`opencat/desktop-browser-local-agent`
- OpenSpec 归档目标：`openspec/changes/archive/2026-04-13-desktop-browser-local-agent`
- 结果：已完成 propose / apply / archive / merge 链路准备中的实现与归档记录，待合并回 `master`

## 执行者信息

- 展示名：栈桥猫
- Git 身份：`栈桥猫 <zhanqiaomao@opencat.dev>`
- 角色：本机桥接工匠
- 性格：沉稳清醒，喜欢先理顺边界再动手
- 口头禅：桥搭稳了，两边都能顺爪通行

## 变更动机

浏览器模式此前一直依赖 `localStorage`、默认知识库列表和模拟任务来“假装可用”，这会掩盖真实同机体验是否打通，也让桌面端与浏览器端读取的是两套状态。本次改造优先落一个安全的 MVP：让桌面进程内嵌本机 loopback agent，浏览器直接走真实本机能力，并与桌面端共享设置、授权会话、任务与同步元数据。

## 变更范围

- Rust / Tauri 侧新增 `src-tauri/src/local_agent.rs`，在应用启动时拉起仅绑定 `127.0.0.1` 的本机 HTTP agent，并通过现有命令层复用 bootstrap、设置、授权、知识树、任务、预览、同步元数据与系统打开路径等能力。
- `src-tauri/Cargo.toml` / `Cargo.lock` 引入 `axum` 与 `tower-http`，为本机 agent 提供 HTTP 路由与 localhost CORS 支撑。
- 前端运行时拆成 `src/utils/runtimeClient.ts`、`src/utils/localAgentRuntime.ts`、`src/utils/browserFixtureRuntime.ts`、`src/utils/runtimeTransportTypes.ts`，浏览器正式模式默认连本机 agent，只在显式开关下保留夹具逻辑。
- `AuthPage` 改为浏览器真实 OAuth redirect-return 流程：浏览器向本机 agent 请求授权 URL，回跳当前页面后再通过本机 agent 完成 code exchange 并写入共享会话。
- `App` / `HomePage` / `MarkdownPreviewPane` / `SettingsPage` / `types/app.ts` 调整为能力优先而非 mock 优先：`syncRoot` 允许为空、设置保存走异步结果、预览区不再仅因非 Tauri 就硬编码阻断。
- OpenSpec 新增 `localhost-browser-agent-bridge` 能力，并补充 `tauri-desktop-runtime-and-backend`、`sync-focused-application-experience` 的变更规格。

## 规格影响

- 新能力：`localhost-browser-agent-bridge`
- 修改能力：`tauri-desktop-runtime-and-backend`
- 修改能力：`sync-focused-application-experience`

## 任务完成情况

- [x] 1.1 嵌入 loopback local-agent 并暴露 health / shared backend endpoints
- [x] 1.2 让 browser 与 desktop 复用同一套 settings / session / tasks / sync metadata
- [x] 2.1 前端 runtime client 改为 browser 默认连 local-agent，fixture 只保留显式开关
- [x] 2.2 浏览器授权改为真实 redirect/callback，任务更新改为 polling bridge，并移除主页面中的业务级 mock 分叉
- [x] 3.1 执行 OpenSpec / TypeScript / Rust / build / lint 验证
- [x] 3.2 记录本次未做的 live E2E 验证边界与剩余 MVP 缺口

## 验证结果

- `openspec validate "desktop-browser-local-agent" --type change`：通过
- `npm run typecheck`：通过
- `npm run build`：通过
- `cargo check`：通过
- `cargo fmt`：已执行
- `ReadLints`（本次改动文件）：未发现 IDE lint 报错

## 剩余风险 / 缺口

- 本次未实际启动桌面端并用浏览器完成一轮 live 同机授权与任务观察，因此“共享会话 / 共享任务”目前是基于实现路径、存储复用、编译与构建结果确认，而非真实 E2E 演练确认。
- 本机 agent 当前安全边界是“仅 loopback + localhost CORS allowlist”，尚未加入更细粒度的写操作 token / session 级防护。
- 浏览器预览已经可走真实预览读取接口，但 Markdown 相对图片与更细的浏览器预览资产改写仍缺少专项验证与进一步收口。
- Rust 核心逻辑目前主要通过 HTTP handler 复用现有 command 层，`commands.rs` 仍偏大；更彻底的 service/core 抽离应作为后续改造继续推进。
