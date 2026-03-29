## Why

用户完成知识库同步后，需要快速访问同步的目标目录（工作区）来查看同步的文档文件。目前用户需要手动在文件资源管理器中导航到同步目录，操作繁琐。

## What Changes

- 在 HomePage 组件的"实际写入目录"显示区域添加一个"打开工作区"按钮
- 点击按钮时调用 Tauri 的 `tauri-plugin-opener` 插件在系统文件管理器中打开同步目录
- 按钮仅在目录路径有效时可用

## Capabilities

### New Capabilities
- `workspace-open-button`: 提供一键打开同步目录的功能，让用户可以快速在系统文件管理器中访问同步的文档

### Modified Capabilities
无

## Impact

- **前端**: `src/components/HomePage.tsx` - 添加按钮组件和点击处理逻辑
- **前端**: `src/utils/tauriRuntime.ts` - 可能需要添加打开目录的封装函数
- **依赖**: 已有 `tauri-plugin-opener` 插件，无需额外安装
