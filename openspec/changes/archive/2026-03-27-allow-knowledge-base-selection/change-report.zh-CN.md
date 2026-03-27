## 基本信息

- 变更名称：`allow-knowledge-base-selection`
- Schema：`spec-driven`
- 归档路径：`openspec/changes/archive/2026-03-27-allow-knowledge-base-selection`

## 变更动机

原有同步来源多选只支持文档节点，知识库树里的“库/目录”节点只能退回到单一范围选择，无法像文档一样加入显式来源集合。对于按目录组织内容的知识库，这会迫使用户在“整库同步”和“逐篇点文档”之间做低效取舍。

## 变更范围

- 允许同一知识库内的目录/库节点与文档节点一起作为显式同步来源。
- 将来源归一化与覆盖判断从“仅文档子树”推广到“目录 + 文档”混合根，自动去掉被祖先目录覆盖的冗余后代选择。
- 更新首页与任务历史中的同步范围摘要，使其能表达目录根、文档根和多个同步根的组合语义。
- 保持整库同步、单目录同步、单文档同步以及旧任务记录的兼容读取。

## 规格影响

- 已更新 `knowledge-base-source-sync`：
  现在允许目录或文档作为同一知识库内的显式选中根，并要求同步规划对重叠根做去重。
- 已更新 `sync-focused-application-experience`：
  现在要求知识库树允许目录节点勾选，并在任务历史里展示混合目录/文档来源的上下文与有效文档数量。
- 本次 delta spec 已同步回主 `openspec/specs`，归档后正式规格与实现保持一致。

## 任务完成情况

- 已完成 7/7 项任务。
- 已完成前端树交互、浏览器模拟层与 Tauri Rust 后端的同构规则更新。
- 已补充目录来源选择、覆盖去重、混合摘要与跨知识库切换的自动化测试。

## 验证结果

- `openspec validate "allow-knowledge-base-selection" --type change` 通过。
- `npm run typecheck` 通过。
- `npm run test` 通过。
- `cargo test` 通过。
- 仓库里另有一个与本变更无关的 `spec/readme-documentation` 在 `openspec validate --all` 下失败；本次 change 与受影响主 spec 均已通过校验。
