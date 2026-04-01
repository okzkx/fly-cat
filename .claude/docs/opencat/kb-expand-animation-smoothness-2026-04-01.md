# OpenCat 变更报告：kb-expand-animation-smoothness

## 基本信息

- **变更名称**：kb-expand-animation-smoothness
- **完成时间**：2026-04-01
- **基础分支**：master

## 执行者身份

- **姓名**：回环猫
- **品种**：暹罗猫
- **职业**：界面魔法师
- **经历**：专注交互细节与动效可感知质量
- **性格**：克制、精确、少即是多
- **口头禅**：动效要顺，状态要真
- **邮箱**：huihuanmao@opencat.dev
- **签名**：🐱 回环猫（界面魔法师·暹罗猫）

## 变更动机

用户在展开/收起知识库来源树时感觉动画不跟手，尤其在异步子节点加载完成后容易出现与展开动效抢同一帧的整树更新，造成卡顿感。

## 变更范围

- `App.tsx`：在 `onLoadTreeChildren` 中，对 `listKnowledgeBaseNodes` 完成后的 `setLoadedSpaceTrees` 使用 React `startTransition` 包裹，将大树更新标为可中断的低优先级更新，让浏览器优先完成展开/收起的过渡绘制。

## 规格影响

- `sync-focused-application-experience`：新增「来源树展开收起视觉流畅性」要求（delta 已随变更归档同步）。

## 任务完成情况

- OpenSpec purpose / apply / validate / archive 流程已完成。
- `npm run typecheck`、`npm test` 已通过。
