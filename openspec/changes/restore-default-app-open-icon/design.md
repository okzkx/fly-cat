## Context

目录节点已通过 `mapFolderPath` + `open_workspace_folder` 打开本地文件夹。文档落盘路径由 `mapDocumentPath(syncRoot, SourceDocument)` 决定，与树节点上的 `SyncScope`（含 `title`、`pathSegments`、空间信息）可对齐。当前 Rust 命令显式拒绝非目录路径，导致无法对 `.md` 文件调用同一 opener。

## Goals / Non-Goals

**Goals:**

- 文档与 bitable 行内展示与目录一致的 FolderOpen 风格「使用默认应用打开」控件。
- 使用与同步引擎相同的规则解析本地 Markdown 路径并打开。
- 最小化 API 面：继续复用 `open_workspace_folder` / `openWorkspaceFolder`。

**Non-Goals:**

- 不改变浏览器内打开飞书文档的现有按钮行为。
- 不为 bitable 单独定义非 Markdown 的打开逻辑（仍打开导出的 `.md`）。

## Decisions

1. **路径计算**：在 `path-mapper` 中新增从 `SyncScope` 构造与 `mapDocumentPath` 一致的本地 `.md` 路径的辅助函数（内部组装 `SourceDocument` 字段或抽取共用逻辑），避免 `HomePage` 重复 sanitization 规则。
2. **后端**：去掉「必须是目录」的校验，保留「路径必须存在」；对文件与目录均调用 `app.opener().open_path(...)`。Windows/macOS/Linux 上 opener 插件对文件会交给默认关联应用。
3. **UI**：文档/bitable 与目录共用同一 Tooltip 文案「使用默认应用打开」，错误提示区分「文件不存在」与目录场景（可复用现有 `path not found` 文案链）。

## Risks / Trade-offs

- [误打开非预期路径] → 仅允许通过 `mapDocumentPath` 同源规则计算的路径，不暴露任意路径输入。
- [命令名仍含 folder] → 保持兼容与单点注册；注释与规格描述为「工作区路径（文件或目录）」。

## Migration Plan

纯客户端行为与命令实现放宽，无需数据迁移。

## Open Questions

None.
