# 归档变更报告

## 基本信息

- 变更名称：`fix-tauri-dev-port-release`
- 归档目录：`openspec/changes/archive/2026-03-27-fix-tauri-dev-port-release`
- Schema：`spec-driven`
- 报告文件：`change-report.zh-CN.md`

## 变更动机

本次变更的目标是修复自定义 `npm run tauri dev` 包装脚本在 Windows 上的两个实际问题：一是直接 `spawn` `tauri.cmd` 会触发 `spawn EINVAL`，导致 Tauri 开发流程根本起不来；二是包装脚本退出时没有主动管理自己拉起的开发进程树，容易留下继续占用 localhost 端口的 Vite 进程。

## 变更范围

- 重构 `scripts/run-tauri.mjs` 的 Tauri CLI 启动方式，改为通过 Node 直接调用 `@tauri-apps/cli/tauri.js`
- 为 dev 包装脚本增加统一的退出清理逻辑，删除临时 override 文件并在 Windows 上使用 `taskkill /T /F` 清理子进程树
- 导出可测试的辅助函数，补充 `tests/run-tauri.test.ts` 覆盖命令解析与清理行为
- 不改动 OAuth 回调端口池，也不扩展到非本次问题直接相关的桌面运行时功能

## 规格影响

- 更新 capability：`localhost-port-resilience`
- 更新 capability：`tauri-desktop-runtime-and-backend`
- 新增开发端口生命周期清理要求，要求 wrapper 退出时清理其启动的开发进程树
- 补充 Windows 场景要求，要求仓库提供的 Tauri 开发包装脚本能成功拉起底层 Tauri CLI

## 任务完成情况

- 已完成：4/4

### 已完成任务

- 1.1 Replace the Windows-incompatible Tauri CLI spawn path with a cross-platform invocation that works in the wrapper script
- 1.2 Add wrapper shutdown cleanup that removes the temporary override file and terminates the dev process tree started by the wrapper
- 2.1 Add automated tests for command resolution and cleanup behavior in `scripts/run-tauri.mjs`
- 2.2 Run the targeted test command and `openspec validate --change "fix-tauri-dev-port-release"`

## 设计摘要

- 选择直接调用 `tauri.js` 而不是依赖 `.cmd` shim，避免 Windows shell 包装细节导致的 `spawn EINVAL`
- 将退出清理统一收敛到一条路径，确保临时配置文件删除和子进程树终止不会分散在多个分支里
- 通过轻量 Vitest 用例锁住回归点，让后续修改脚本时能尽快发现 Windows 启动或清理逻辑被破坏
