## Context

飞猫助手是一个 Tauri 2.x 桌面应用，用于同步飞书知识库到本地目录。当前用户在 HomePage 组件中可以看到"实际写入目录"的路径显示，但无法直接打开该目录，需要手动复制路径并在文件管理器中导航。

项目已集成 `tauri-plugin-opener` 插件（版本 2.5.3），该插件提供了跨平台的打开文件/目录能力。

**技术栈约束：**
- 前端：React 19 + TypeScript + Ant Design 5.x
- 后端：Tauri 2.x + Rust
- 已有插件：`tauri-plugin-opener`

## Goals / Non-Goals

**Goals:**
- 在 HomePage 的"实际写入目录"显示区域添加一个"打开工作区"按钮
- 点击按钮时在系统默认文件管理器中打开同步目录
- 按钮应该有清晰的视觉提示（图标 + 文字）
- 按钮在目录路径不存在时应优雅地处理错误

**Non-Goals:**
- 不修改同步目录的配置逻辑
- 不添加目录创建功能（由同步任务负责创建）
- 不支持自定义文件管理器

## Decisions

### D1: 使用 tauri-plugin-opener 的 `openPath` API

**选择：** 直接使用 `@tauri-apps/plugin-opener` 的 `openPath` 函数

**理由：**
- 项目已安装该插件，无需额外依赖
- 该插件提供了跨平台支持（Windows/macOS/Linux）
- `openPath` 函数可以直接打开目录并在文件管理器中显示

**替代方案：**
- 使用 Tauri Core 的 `shell` API：功能类似，但 opener 插件更现代化
- 自定义 Rust command：需要更多代码，且 opener 插件已提供完善功能

### D2: 按钮位置与样式

**选择：** 在"实际写入目录"行右侧添加一个小型链接样式按钮

**理由：**
- 与现有 UI 风格一致
- 不占用过多空间
- 功能相关性强，用户容易发现

**按钮样式：**
- 使用 Ant Design 的 `Button type="link"` 或 `type="text"`
- 添加 `FolderOpenOutlined` 图标
- 文字："打开"

### D3: 错误处理策略

**选择：** 使用 Ant Design 的 `message.error` 显示错误提示

**理由：**
- 与现有代码的错误处理方式一致
- 用户体验友好
- 实现简单

**错误场景：**
- 目录不存在：显示"目录不存在，请先执行同步任务"
- 权限不足：显示"无法访问该目录"

## Risks / Trade-offs

**[R1] 目录不存在时打开失败** → 在点击时检查目录是否存在，若不存在则显示提示信息

**[R2] 跨平台路径格式差异** → 使用 Tauri 的路径处理 API，避免硬编码分隔符

**[R3] 用户可能误以为点击会修改设置** → 按钮使用明确的"打开"文字和图标，避免歧义

## Migration Plan

无需迁移，这是纯增量功能。

**部署步骤：**
1. 在 `src/utils/tauriRuntime.ts` 中添加 `openWorkspaceFolder` 封装函数
2. 在 `src/components/HomePage.tsx` 中添加按钮和点击处理
3. 测试 Windows/macOS/Linux 三个平台

**回滚策略：** 移除添加的代码即可，无数据迁移。

## Open Questions

无。
