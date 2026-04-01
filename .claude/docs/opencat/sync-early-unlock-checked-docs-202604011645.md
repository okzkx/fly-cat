# 变更归档报告：sync-early-unlock-checked-docs

## 基本信息

- **变更名称：** sync-early-unlock-checked-docs
- **归档日期：** 2026-04-01
- **基础分支：** master

## 执行者身份

- **姓名：** 回环猫
- **品种：** 暹罗猫
- **职业：** 界面魔法师
- **性格：** 机敏专注，偏爱小而准的交互设计
- **口头禅：** 轻点一下，流程再转一圈
- **邮箱：** huihuanmao@opencat.dev

## 变更动机

大批量同步时，任务未结束则所有在范围内的文档节点 checkbox 一直被禁用；单篇已成功写入后用户仍无法调整选区。改为按文档粒度、以 `documentSyncStatuses` 的 `synced` 为准即时解锁叶子节点。

## 变更范围

- `src/components/HomePage.tsx`：`buildTreeNodes` / `buildTreeData` 增加 `syncedDocumentIds`，对 `document` / `bitable` 在已同步时不应用同步锁定。
- `openspec/specs/sync-focused-application-experience/spec.md`：更新「Checkbox Locking During Active Sync」需求与场景。

## 规格影响

- 修改能力 `sync-focused-application-experience`：新增「活跃任务中单篇已同步即可勾选」场景；收紧「同步开始后锁定」表述为按节点类型区分。

## 任务完成情况

- Purpose / Apply / Archive 检查点提交已完成；OpenSpec 变更已移至 `openspec/changes/archive/2026-04-01-sync-early-unlock-checked-docs/`。
- 验证：`openspec validate sync-early-unlock-checked-docs --type change`（归档前）、`npm test`（79 通过）、`npm run typecheck` 通过；项目无 `npm run lint` 脚本。
