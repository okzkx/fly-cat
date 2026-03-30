# 变更报告: fix-opener-permission

## 基本信息

| 项目 | 内容 |
|------|------|
| 变更名称 | fix-opener-permission |
| 归档日期 | 2026-03-30 |
| Schema | spec-driven |

## 变更动机

点击"打开工作区"按钮时报错：`opener.open_path not allowed. Permissions associated with this command: opener:allow-open-path`

Tauri v2 使用权限系统，需要在配置中显式声明允许使用的 API 权限。当前缺少 `opener:allow-open-path` 权限声明，导致调用 `opener.open_path` 时被拒绝。

## 变更范围

- 修改文件: `src-tauri/capabilities/default.json`
- 添加权限: `opener:allow-open-path`

## 规格影响

- 更新 `tauri-desktop-runtime-and-backend` spec，新增 "Opener Permission for Opening Local Paths" 需求

## 任务完成情况

| 任务 | 状态 |
|------|------|
| 添加 opener:allow-open-path 权限 | 完成 |
| 验证打开工作区按钮正常工作 | 完成 |

## 总结

本次变更通过在 Tauri capabilities 配置中添加 `opener:allow-open-path` 权限，修复了点击"打开工作区"按钮时的权限错误。
