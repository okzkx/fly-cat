# 变更报告： 工作区打开按钮

## 基本信息

- **变更名称**: workspace-open-button
- **变更日期**: 2026-03-29
- **变更类型**: 功能增强
- **变更作者**: Claude

## 变更动机

用户完成知识库同步后，需要快速访问同步的目标目录（工作区）来查看同步的文档文件。目前用户需要手动在文件资源管理器中导航到同步目录，操作繁琐。

## 变更范围

### 新增文件

无

### 修改文件

| 文件 | 变更说明 |
|------|--------|
| `src/utils/tauriRuntime.ts` | 新增 `openWorkspaceFolder` 函数 |
| `src/components/HomePage.tsx` | 添加"打开"按钮和点击处理 |

### 新增依赖

无（使用已有的 `@tauri-apps/plugin-opener`）

## 规格影响

### ADDED Requirements

- **Open workspace folder button**: 系统应在 HomePage 中提供按钮，允许用户一键打开同步目录

## 任务完成情况

| 任务 | 状态 |
|------|------|
| 添加 openWorkspaceFolder 封装函数 | 完成 |
| 目录不存在时显示错误提示 | 完成 |
| 打开失败时显示错误提示 | 完成 |
| 在 HomePage 添加"打开"按钮 | 完成 |
| 按钮使用 FolderOpenOutlined 图标 | 完成 |
| 点击按钮调用 openWorkspaceFolder 函数 | 完成 |

## 测试验证

- [ ] Windows: 点击"打开"按钮，验证文件管理器打开
- [ ] macOS: 点击"打开"按钮，验证 Finder 打开
- [ ] Linux: 点击"打开"按钮，验证默认文件管理器打开

## 遗留问题

无
