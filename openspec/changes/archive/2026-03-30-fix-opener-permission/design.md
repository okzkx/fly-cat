## Context

项目使用 Tauri v2 + tauri-plugin-opener 2.5.3。前端通过 `@tauri-apps/plugin-opener` 的 `openPath` 函数打开本地文件夹。

当前权限配置 (`src-tauri/capabilities/default.json`) 包含 `opener:default`，但这只包含基本的 opener 权限，不包含 `open_path` 命令权限。

Tauri v2 的权限系统要求显式声明每个允许使用的命令。

## Goals / Non-Goals

**Goals:**
- 添加 `opener:allow-open-path` 权限，使"打开工作区"功能正常工作

**Non-Goals:**
- 不修改其他权限
- 不修改 opener 插件版本

## Decisions

**权限添加方式**：在 `opener:default` 后添加 `opener:allow-open-path`

- **选择**：直接添加具体权限
- **原因**：`opener:default` 是权限集合，可能不包含 `open_path` 命令权限
- **替代方案**：使用 `opener:allow-all` - 但这会授予过多权限，不符合最小权限原则

## Risks / Trade-offs

- **无已知风险**：这是一个简单的权限添加，只影响 opener 插件的 open_path 命令
