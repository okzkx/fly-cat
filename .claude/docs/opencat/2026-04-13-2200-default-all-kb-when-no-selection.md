# 归档：无勾选时默认整库同步与全量刷新

## 基本信息

- **变更名称**：`default-all-kb-when-no-selection`
- **归档目录**：`openspec/changes/archive/2026-04-13-default-all-kb-when-no-selection`
- **基线分支**：`master`
- **任务分支**：`opencat/default-all-kb-when-no-selection`
- **执行模式**：worktree（槽位 `F:\okzkx\feishu_docs_sync-worktree`）

## 执行者身份

- **展示名 / Git user.name**：扫帚猫
- **Git user.email**：saozhoumao@opencat.dev
- **角色**：交互设计师（布偶猫）
- **经历摘要**：曾把工作台杂乱入口整理为清晰主路径，擅长批量操作与状态反馈。
- **性格**：细致稳妥，偏爱清爽直接的交互
- **习惯用语**：先把界面扫干净，再让操作顺爪

## 变更动机

未勾选树节点时，「开始同步」不可用、「全部刷新」无目标，与用户「先整库来一轮」的心智不符；在明确不扩大破坏性操作（强制更新、批量删除）的前提下，对「开始同步」与「全部刷新」采用与「全选知识库 / 全部已同步文档」等价的默认范围。

## 变更范围

- `src/utils/syncSelection.ts`：新增 `buildAllKnowledgeSpaceScopes`
- `src/App.tsx`：`onCreateTask` 在无 `selectedSources` 时用全部知识空间整库 scope
- `src/components/HomePage.tsx`：`refreshFreshnessDocumentIds`、批量刷新逻辑与按钮可用性、工具提示与失败提示
- `openspec/specs/sync-focused-application-experience/spec.md`：由归档流程合并增量需求

## 规格影响

- **sync-focused-application-experience**：新增「无勾选开始同步」「无勾选全部刷新」「破坏性操作仍须勾选」三类场景。

## 任务完成情况

- Purpose / Apply / Archive 三阶段提交已完成；`openspec validate` 与 `npm run build` 已通过。
- **自动化测试**：未执行 `playwright-cli`。原因：首页工具栏行为依赖飞书登录与真实知识库数据，无稳定可复用的免登录 URL 与固定夹具，不具备可重复断言的 Web 自动化入口。

## 备注

- 扫帚猫：强制更新与批量删除仍要求勾选，避免一键误伤全库。
