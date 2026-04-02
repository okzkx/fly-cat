## Why

根目录 `DONE.md` 是 OpenCat 工作流的完成记录权威来源，但历史条目存在断行、同日记录分散、个别句子未收尾等问题，与 `/opencat-work` 推荐的「一行一条、时间 + 任务名 + 变更摘要」格式不完全一致。需要在**不篡改历史事实**的前提下做最小结构化整理，便于后续队列维护与检索。

## What Changes

- 修正明显格式缺陷（如单条记录被拆成两行、句末悬空的逗号）。
- 将同一日期的完成记录按「较新归档/记录在前」与文件顶部区块对齐（仅调整顺序，不改写语义）。
- 保持条目为单行 bullet，时间与正文使用全角 `—` 分隔；保留既有执行者署名（🐱）等事实信息。
- 在 OpenSpec 中新增能力规格 `project-done-log`，固化 `DONE.md` 的维护约定。

## Capabilities

### New Capabilities

- `project-done-log`: 约定根目录 `DONE.md` 的标题、条目格式、精简程度与 OpenCat `/opencat-work` 的对应关系。

### Modified Capabilities

（无）

## Impact

- 仅影响 `DONE.md` 文本与 `openspec/specs/project-done-log/spec.md`；应用代码与构建无变更。
