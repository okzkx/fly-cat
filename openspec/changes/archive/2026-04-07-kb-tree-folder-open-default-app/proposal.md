## Why

知识库树中「文档 / 多维表格」节点已有在浏览器打开的快捷操作，但「目录」节点没有对应的本机入口；用户同步后常需要在资源管理器或系统默认方式中打开该目录对应的本地文件夹，目前只能手动在同步根下查找路径。

## What Changes

- 在知识库树中，为 **目录（folder）** 节点增加一个图标按钮，点击后使用与「打开同步根目录」相同的后端能力，在系统中用默认应用（通常是文件管理器）打开该目录在同步根下的对应文件夹路径。
- 路径计算与文档落盘规则一致（空间名与路径段经过相同的安全化），若本地目录尚不存在则给出明确错误提示。
- 非 Tauri 运行时保持与现有「打开目录」行为一致（提示不可用或等价处理）。

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `knowledge-tree-display`: 目录节点需暴露「使用默认应用打开」本地同步目录的操作及可见反馈。

## Impact

- 前端：`HomePage.tsx` 树节点 `titleRender`、可选 `path-mapper` 辅助函数。
- 复用：`open_workspace_folder` / `openWorkspaceFolder`，与现有同步根「打开」一致。
- 测试：`path-mapper` 单测可补充目录路径映射用例。
