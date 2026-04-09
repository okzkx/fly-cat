# fix-force-update-ui-state-sync — 归档报告

## 基本信息

- **变更名称**: `fix-force-update-ui-state-sync`
- **归档目录**: `openspec/changes/archive/2026-04-09-fix-force-update-ui-state-sync/`
- **日期**: 2026-04-09 12:03

## 执行者

- **展示名 / Git user.name**: 回环猫
- **Git user.email**: huihuanmao@opencat.dev
- **角色**: 界面魔法师
- **品种**: 暹罗猫
- **性格**: 机敏专注，偏爱小而准的交互设计
- **口头禅**: 轻点一下，流程再转一圈

## 变更动机

复核现有 `强制更新` 前端链路后确认，问题不是本地删除没有发生，而是 UI 回显顺序不对：代码先删本地文件，再等待较慢的新鲜度检查和元数据对齐，直到最后才刷新同步状态并创建任务，所以用户只能看到按钮转圈，看不到“已变未同步”和“任务已入队”。

## 变更范围

- `src/components/HomePage.tsx`：重排强制更新流程，先回读同步状态，再提前入队任务，并对刚被 strip 的文档维持短暂的 `未同步` 遮罩，避免 pending 任务过早把树节点显示成“同步中”。
- `src/App.tsx`：拆分 Home 页任务回调，支持“只创建不立即启动”的 pending 任务，并在前端任务状态中立即插入新任务；失败时支持删除已排队任务。
- `src/types/app.ts`：补充 Home 页任务创建选项，以及显式的启动 / 删除任务回调类型。

## 规格影响

- `openspec/specs/knowledge-tree-display/spec.md`：补充 **强制更新** 在 strip 成功后必须立即回显 `未同步`，并要求后续同步任务在 metadata 阶段结束前就能出现在任务摘要和任务列表中。

## 任务完成情况

- OpenSpec propose / apply / archive 流程已完成。
- `openspec archive "fix-force-update-ui-state-sync" -y` 已执行，并已将 delta spec 合并回主规格。

## 验证

- 代码复核确认旧根因：`prepareForceRepulledDocuments()` 之后还要等待 freshness/alignment，`onCreateTask()` 放在最后，导致界面状态和任务列表都延迟更新。
- `npm run typecheck`
- `npm test`
- `openspec validate "fix-force-update-ui-state-sync" --type change`

## 剩余风险

- 本次修复把“任务尽早可见”和“树节点保持未同步直到真正启动”放在前端状态层协调；如果后续再改动 pending 任务如何映射到树节点 `syncingIds`，需要同步检查这层遮罩逻辑是否仍然成立。
