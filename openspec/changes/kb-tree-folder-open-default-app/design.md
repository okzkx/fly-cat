## Context

知识库树在 `HomePage` 的 `titleRender` 中为文档 / 多维表格提供了「在浏览器打开」的文本按钮；同步根区域已有「打开」调用 `openWorkspaceFolder(syncRoot)`。目录节点有 `SyncScope.pathSegments` 与 Rust 侧落盘规则一致，可通过与 `mapDocumentPath` 相同的安全化规则拼出目录绝对路径。

## Goals / Non-Goals

**Goals:**

- 目录节点提供与文档侧操作并列的轻量图标入口，点击后在桌面端用系统默认方式打开对应本地文件夹。
- 路径与已有 Markdown 输出目录结构一致，避免「树里点的目录」与磁盘实际不一致。

**Non-Goals:**

- 不为目录增加浏览器打开（飞书 Web）——与「本机同步目录」语义不同，保持现有文档/表格行为即可。
- 不新增 Rust 命令；复用 `open_workspace_folder`。

## Decisions

- **路径计算放在前端 `path-mapper`**：导出 `mapFolderPath(syncRoot, spaceName, spaceId, pathSegments)`，内部复用与 `mapDocumentPath` 相同的 `sanitizePathSegment`，目录为 `join(syncRoot, safeSpace, ...sanitizedSegments)`，与 `markdown_output_path` 中「除最后一级文档名外的目录部分」一致（目录节点的 `path_segments` 已包含该目录标题作为最后一段）。
- **图标与交互**：使用独立图标（如 `FolderOpenOutlined`）与文档的 `ExportOutlined` 区分；`Tooltip` 文案为「使用默认应用打开」；点击 `stopPropagation` 避免误触树选中。
- **错误处理**：与 `handleOpenWorkspace` 相同模式，目录不存在 / 权限等问题用 `message` 反馈。

## Risks / Trade-offs

- **尚未同步、目录未创建** → 后端返回不存在；用户看到与打开同步根类似的提示，需在文案上可区分（可写「本地目录不存在，请先同步该目录」）。
- **浏览器模式** → `openWorkspaceFolder` 已返回「非 Tauri」错误；保持现状即可。

## Migration Plan

不适用；纯前端行为与路径工具函数增量。

## Open Questions

无。
