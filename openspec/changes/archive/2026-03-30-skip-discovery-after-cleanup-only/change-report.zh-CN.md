# 变更报告：仅清理时跳过发现阶段

## 基本信息

- **变更名称**: `skip-discovery-after-cleanup-only`
- **流程 Schema**: `spec-driven`
- **归档路径**: `openspec/changes/archive/2026-03-30-skip-discovery-after-cleanup-only`

## 变更动机

当用户只是取消勾选已同步的文档或文件夹，希望本地删除这些内容时，点击“开始同步”不应该再继续创建同步任务。原实现会在清理完成后回退到 `selectedScope` 并触发新的发现流程，进而把无关的远端限流错误暴露成“删除失败”。

## 变更范围

- 新增 cleanup-only 判定逻辑：删除未勾选已同步文档后，在没有显式同步源时直接结束。
- 保留现有本地清理与状态刷新逻辑。
- 首页在 cleanup-only 场景下展示“已完成清理”提示，而不是误报未选择同步范围。
- 增加针对 cleanup-only 分支的回归测试。

## 设计摘要

- 使用轻量 helper 统一判断 cleanup-only 分支，避免把这条条件硬编码到多处。
- `App.tsx` 在本地清理完成后返回结构化结果，由 `HomePage` 决定显示何种提示。
- 不修改正常同步路径中 `selectedScope` 的回退行为，仅在“先做了清理且无显式选中源”时跳过建任务。

## 规格影响

- 更新 `synced-doc-checkbox` 能力中的“Auto-delete Unchecked Synced Documents on Sync Start”要求。
- 新增场景：cleanup-only 操作完成本地清理后不得创建后续同步任务，也不得触发远端 discovery。

## 任务完成情况

- [x] 在 `App.tsx` 中实现 cleanup-only 返回路径
- [x] 保留清理后状态刷新与正常同步流程
- [x] 在 `HomePage.tsx` 中展示 cleanup-only 提示
- [x] 增加 focused regression test 并通过
