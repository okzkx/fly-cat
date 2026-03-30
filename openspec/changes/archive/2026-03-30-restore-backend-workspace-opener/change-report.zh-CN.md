# 变更报告：恢复后端工作目录打开路径

## 基本信息

- **变更名称**: `restore-backend-workspace-opener`
- **变更日期**: 2026-03-30
- **变更类型**: 缺陷修复
- **归档路径**: `openspec/changes/archive/2026-03-30-restore-backend-workspace-opener`

## 变更动机

“实际写入目录 -> 打开” 操作在 Tauri 桌面环境中仍会对部分绝对路径目录返回 `Not allowed to open path ...`。虽然前端已声明 opener 权限，但直接从前端调用本地路径打开仍不稳定，因此需要把目录打开动作重新收回到后端命令执行。

## 变更范围

### 修改文件

| 文件 | 变更说明 |
|------|----------|
| `src-tauri/src/commands.rs` | 新增 `open_workspace_folder` 后端命令，校验目录存在性并通过 backend opener 打开 |
| `src-tauri/src/lib.rs` | 注册 `open_workspace_folder` 到 Tauri invoke handler |
| `src/utils/tauriRuntime.ts` | Tauri 模式下改为 `invoke("open_workspace_folder")`，保留原有返回结构 |
| `openspec/specs/tauri-desktop-runtime-and-backend/spec.md` | 将工作目录打开规范同步为后端命令路径 |

## 规格影响

### MODIFIED Requirements

- `tauri-desktop-runtime-and-backend`
  - 工作目录打开能力改为通过后端命令完成
  - 绝对用户目录必须可以被系统文件管理器可靠打开
  - 后端打开失败时必须继续把错误传回前端

## 任务完成情况

| 任务 | 状态 |
|------|------|
| 新增 Rust `open_workspace_folder` 命令 | 完成 |
| 在 Tauri invoke handler 中注册命令 | 完成 |
| 前端 `openWorkspaceFolder(...)` 改为调用后端命令 | 完成 |
| 保持现有前端返回结构和页面反馈行为 | 完成 |
| 执行 OpenSpec 校验与后端编译验证 | 完成 |

## 测试验证

- [x] `openspec validate restore-backend-workspace-opener --type change`
- [x] `cargo check`

## 遗留问题

- 当前仅验证了 OpenSpec 与 Rust 编译链路；尚未执行桌面端手动点击 “打开” 的端到端验证。
