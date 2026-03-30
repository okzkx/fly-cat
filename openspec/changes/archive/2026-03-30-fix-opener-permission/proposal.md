## Why

点击"打开工作区"按钮时报错：`opener.open_path not allowed. Permissions associated with this command: opener:allow-open-path`

Tauri v2 使用权限系统，需要在配置中显式声明允许使用的 API 权限。当前缺少 `opener:allow-open-path` 权限声明，导致调用 `opener.open_path` 时被拒绝。

## What Changes

- 在 Tauri 权限配置中添加 `opener:allow-open-path` 权限

## Capabilities

### New Capabilities

无新增能力

### Modified Capabilities

- `tauri-desktop-runtime-and-backend`: 添加 opener 权限以支持打开本地文件夹

## Impact

- 修改 Tauri 权限配置文件
- 影响"打开工作区"功能的可用性
