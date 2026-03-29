# 变更报告：async-blocking-commands

## 基本信息

| 项目 | 内容 |
|------|------|
| 变更名称 | async-blocking-commands |
| 模式 | openspec-change/v1 |
| 归档路径 | openspec/changes/archive/2026-03-29-async-blocking-commands/ |

## 变更动机

两个核心 Tauri 命令在主线程上同步执行阻塞式 HTTP 调用，导致 UI 卡顿：
1. `list_space_source_tree`：展开树节点时阻塞主线程，每个节点需要多次 HTTP 请求（获取空间名、解析路径段、列出子节点）
2. `create_sync_task`：创建同步任务时阻塞主线程，需要递归遍历所有子节点并对每个叶子文档调用 `fetch_document_summary`，50 个文档意味着 50+ 次顺序 HTTP 请求

## 变更范围

- 添加 `tokio` 依赖（`rt-multi-thread` feature）
- `list_space_source_tree` 改为 `async` Tauri 命令，使用 `tokio::task::spawn_blocking` 将 HTTP 调用移至后台线程
- `create_sync_task` 改为 `async` Tauri 命令，将文档发现阶段（`discover_documents_from_sources`）移至 `spawn_blocking`
- 前端无需修改——Tauri invoke 在同步和异步模式下均返回 Promise

## 规格影响

- `tauri-desktop-runtime-and-backend`：新增 1 条 ADDED 需求（非阻塞树加载和任务创建命令）

## 任务完成情况

| # | 任务 | 状态 |
|---|------|------|
| 1 | 添加 tokio 依赖 | 完成 |
| 2 | 转换 list_space_source_tree 为 async 命令 | 完成 |
| 3 | 转换 create_sync_task 为 async 命令 | 完成 |
| 4 | cargo check 通过 | 完成 |
| 5 | cargo test 通过 (29 tests) | 完成 |

## 技术方案

选择 `tokio::task::spawn_blocking` 而非将 ureq 替换为 async HTTP 客户端（如 reqwest），原因：
- ureq 是同步客户端，替换需重写 `FeishuOpenApiClient` 全部 10+ 个方法及所有调用点
- 并行文档同步已通过 `std::thread::scope` 实现，async HTTP 收益有限
- `spawn_blocking` 以最小改动量将阻塞工作移至独立线程池，立即释放主线程
