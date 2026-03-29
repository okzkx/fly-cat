# 变更报告：sync-per-document-progress

## 基本信息

- **变更名称**: sync-per-document-progress
- **Schema**: spec-driven
- **归档路径**: `openspec/changes/archive/2026-03-29-sync-per-document-progress/`

## 变更动机

同步任务使用 8 并发批量处理文档，导致进度事件虽然在每个文档完成后都发送，但由于 8 个文档几乎同时完成，用户感知进度为"每 8 篇更新一次"。此外，UI 只显示成功/跳过/失败计数，缺少总文档数信息，用户无法直观评估剩余工作量。

## 变更范围

- **后端** `src-tauri/src/commands.rs`: 移除 `std::thread::scope` 并行处理和 `concurrency = 8` 的分块逻辑，改为逐文档串行处理，每完成一篇文档即 emit 进度事件
- **前端** `src/components/TaskListPage.tsx`: 在任务列表"统计"列新增"已处理 X / 共 Y"显示行

## 规格影响

- **knowledge-base-source-sync**: 修改 1 项需求（增加逐文档进度事件发射和总数报告），新增 1 项需求（前端逐文档进度展示）

## 任务完成情况

全部 6 项任务已完成：

1. 后端：移除并发参数
2. 后端：替换 thread::scope 为串行循环
3. 后端：保留逐文档 emit 调用
4. 前端：添加"已处理 X / 共 Y"显示
5. 前端：模拟进度格式无需额外修改（由 TaskListPage 统一处理）
6. 验证通过
