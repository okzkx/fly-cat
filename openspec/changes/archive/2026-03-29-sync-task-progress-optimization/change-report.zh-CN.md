# 变更报告：sync-task-progress-optimization

## 基本信息

- **变更名称**：sync-task-progress-optimization
- **归档路径**：`openspec/changes/archive/2026-03-29-sync-task-progress-optimization/`

## 变更动机

用户点击"开始同步"后，同步任务出现很慢。原因是 `create_sync_task` 在返回任务前会同步执行文档发现（对飞书 API 发起 N 次 HTTP 请求），阻塞整个命令。此外，同步开始后进度事件按批次（每 8 篇文档）而非逐篇发送，用户无法看到实时下载进度。

## 变更范围

- **后端 (Rust)**：`create_sync_task` 不再执行文档发现，立即返回任务；新增 "discovering" 生命周期状态；进度事件改为逐篇文档发送
- **前端 (React)**：任务列表支持 "发现文档中" 状态显示；进度条和统计列在发现阶段显示加载状态
- **类型定义**：`SyncLifecycleState` 新增 `"discovering"` 值

## 规格影响

- `sync-focused-application-experience` 新增"发现阶段可见性"需求及两个场景

## 任务完成情况

| # | 任务 | 状态 |
|---|------|------|
| 1 | 移除 `create_sync_task` 中的文档发现 | 已完成 |
| 2 | 新增 "discovering" 生命周期状态 | 已完成 |
| 3 | 逐篇文档发送进度事件 | 已完成 |
| 4 | TaskListPage 支持发现状态显示 | 已完成 |
| 5 | 更新 spec | 已完成 |
