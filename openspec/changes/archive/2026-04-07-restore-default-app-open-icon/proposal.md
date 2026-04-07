## Why

知识库树里「目录」节点已有「使用默认应用打开」图标，但 **文档 / 多维表格** 节点缺少对应入口；用户同步后无法用系统默认应用（如编辑器）一键打开本地 `.md` 文件，与此前对本地文件操作的预期不一致，属于交互回归。

## What Changes

- 在知识库树中，为 **文档** 与 **多维表格（bitable）** 节点增加与目录同款的「使用默认应用打开」图标按钮。
- 点击后打开该节点在同步根下对应的已导出 Markdown 文件路径（路径计算与同步落盘规则一致）。
- 扩展后端 `open_workspace_folder` 能力，使其在路径为**已存在的文件**时也能通过系统默认应用打开（目录行为保持不变）；本地文件不存在时给出明确错误提示。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `knowledge-tree-display`: 文档与 bitable 节点需暴露「使用默认应用打开」本地已同步 Markdown 的操作及可见反馈；与现有目录节点行为对齐。

## Impact

- 前端：`HomePage.tsx` 树 `titleRender`、路径辅助（复用/扩展 `path-mapper`）。
- 后端：`src-tauri/src/commands.rs` 中 `open_workspace_folder` 放宽为支持文件路径。
- 前端运行时：`tauriRuntime.ts` 文档注释与调用约定（仍复用 `openWorkspaceFolder`）。
