# 归档变更报告

## 基本信息

- 变更目录：`2026-03-27-optimize-tauri-port-handling`
- 工作流 Schema：`spec-driven`
- 归档报告文件：`change-report.zh-CN.md`
- 任务完成度：6/6
- 规格变更数量：3

## 变更背景

当前 Tauri 开发流程和桌面 OAuth 回调流程依赖多个写死的本地端口，容易在开发机或终端用户环境中与其他应用发生冲突，导致 `tauri dev` 无法启动或飞书登录回调初始化失败。需要将端口处理改为更具弹性和可恢复性，同时保证用户能够获得明确的配置与失败提示。

## 变更内容

- 调整 Tauri 开发态端口策略，避免因为固定 Vite/HMR 端口被占用而直接阻断本地开发。
- 扩展桌面 OAuth 回调端口选择策略，从少量固定端口改为可容忍常见占用场景的本地端口池。
- 更新设置页与授权页文案，使用户知道需要在飞书应用中配置一组回调地址，并在端口不可用时看到可操作的提示。

## 关键设计

### 1. Vite 开发服务器改为允许端口回退

将 `vite.config.ts` 中的 `strictPort` 从强制固定改为允许回退，并移除固定 HMR 端口。这样在 `1430` 被占用时，Vite 可以自动尝试下一个可用端口，Tauri CLI 通过 dev server 实际启动结果连接前端。

备选方案：
- 继续固定端口并要求开发者手工排障：成本低，但体验差
- 启动前自行扫描并写回 `tauri.conf.json`：更复杂，也不如直接交给 Vite 处理

### 2. OAuth 回调使用受控端口池而非单一或双端口

保留 `localhost` 回调模式，但把候选端口从 `[3000, 3001]` 扩展为一组连续端口，例如 `3000-3010`。这兼顾了两点：一是用户可以在飞书应用里一次性登记有限范围的回调地址，二是冲突时仍有多次重试空间。

备选方案：
- 使用 `127.0.0.1:0` 随机端口：技术上最灵活，但飞书端无法预先登记无限随机回调地址
- 维持 2 个端口：实现最简单，但对真实环境冲突过于脆弱

### 3. 对端口耗尽给出显式错误与配置指引

授权页在初始化本地 OAuth 回调失败时，应提示用户检查端口占用，且设置页/README 应列出完整的回调地址范围，减少“代码支持多个端口，但文档只写两个端口”的不一致。

备选方案：
- 只改代码，不改文档：会让用户难以正确配置飞书应用
- 只改文档，不改错误提示：出问题时仍然难排查

## 规格影响

- `localhost-port-resilience`：归档中包含 delta spec（`specs/localhost-port-resilience/spec.md`）
- `sync-focused-application-experience`：归档中包含 delta spec（`specs/sync-focused-application-experience/spec.md`）
- `tauri-desktop-runtime-and-backend`：归档中包含 delta spec（`specs/tauri-desktop-runtime-and-backend/spec.md`）

## 任务完成情况

- 已完成：6
- 未完成：0

### 已完成任务

- 1.1 Relax the fixed Vite development port strategy so localhost port conflicts do not immediately block `tauri dev`
- 1.2 Update Tauri development configuration to match the resilient frontend dev server behavior
- 2.1 Expand the desktop OAuth callback port pool and keep redirect URI generation aligned with the selected port
- 2.2 Show actionable authorization errors when no supported localhost callback port can be bound
- 3.1 Update settings and README guidance to document the supported localhost callback address range
- 3.2 Run validation and project checks for the port-resilience change

### 未完成任务

- 无
