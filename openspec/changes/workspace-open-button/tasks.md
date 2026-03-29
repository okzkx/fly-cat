# Tasks

## 1. 添加打开工作区按钮封装函数

- [x] 在 `src/utils/tauriRuntime.ts` 中添加 `openWorkspaceFolder` 封装函数，使用 Tauri 的 opener 插件在系统文件管理器中打开同步目录
- [x] 目录不存在时显示错误提示
- [x] 打开失败时显示错误提示

## 2. 在 HomePage 添加打开工作区按钮

- [x] 在 HomePage 的"实际写入目录"显示区域添加"打开"按钮
- [x] 按钮使用 FolderOpenOutlined 图标
- [x] 点击按钮调用 openWorkspaceFolder 函数
