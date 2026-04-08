## Why

批量对已同步文档做远端版本检查时，飞书 OpenAPI 在短时间内连续返回 `99991400`（request trigger frequency limit），知识库树上大量出现「检查失败」。需要在一次检查链路内进一步降低请求密度，并让尚未拿到检查结果或排队中的节点有明确 UI 状态。

## What Changes

- 后端 `check_document_freshness`：对需要调用文档信息接口的条目使用带限频重试的摘要拉取，并在连续两次 OpenAPI 调用之间加入固定间隔，保持串行、一节一节对齐。
- 前端：所有触发 `checkDocumentFreshness` 的路径通过同一串行队列执行，避免自动防抖检查与「全部刷新」等操作重叠打爆接口。
- 前端：已同步但尚无 freshness 条目的文档/多维表行显示「待检查」图标；正在执行检查批次时显示「检查中」加载图标。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `knowledge-tree-display`：补充 freshness 指示器在「无结果 / 检查中」时的展示要求；补充批量检查不得与同类调用并发的交互要求。
- `tauri-desktop-runtime-and-backend`：补充 `check_document_freshness` 对文档信息请求的串行节奏与重试策略要求。

## Impact

- `src-tauri/src/commands.rs`：`check_document_freshness` 实现。
- `src/components/HomePage.tsx`：freshness 队列、指示器、title 组件 props。
