# 变更报告：feishu_docs_export

## 基本信息

| 项目 | 内容 |
|------|------|
| 变更名称 | feishu_docs_export |
| 模式 | openspec-change/v1 |
| 归档路径 | openspec/changes/archive/2026-03-29-feishu_docs_export/ |

## 变更动机

知识库内单个文件的网络请求速度快，但整体导出速度慢。根因是文档逐个串行处理，每两个文档间有 400ms 固定延迟，且每个文档完成后都立即写 manifest 到磁盘，导致 N 个文档至少需要 N * 400ms 的纯等待时间加上大量重复磁盘 I/O。

## 变更范围

- 移除 `commands.rs` 中的固定 400ms sleep 延迟
- 引入 `std::thread::scope` 实现 concurrency=4 的并行文档处理
- 拆分 `sync.rs` 中 `sync_document_to_disk` 为 `sync_document_content`（不写 manifest）+ 上层批量写入
- 实现批量 manifest 持久化：每 10 个文档写一次，完成时最终写入
- 预解析认证配置，避免每个文档重复加载

## 规格影响

- `specs/sync-pipeline/spec.md`：新增 3 条 MODIFIED 需求（并行处理、无人工延迟、批量 manifest 持久化）

## 任务完成情况

| # | 任务 | 状态 |
|---|------|------|
| 1 | 移除固定 400ms sleep 延迟 | 完成 |
| 2 | 新增内存 manifest 操作函数 | 完成 |
| 3 | 拆分 sync_document_to_disk | 完成 |
| 4 | std::thread::scope 并行处理 | 完成 |
| 5 | 批量 manifest 写入 | 完成 |
| 6 | 验证进度事件和错误记录 | 完成 |
| 7 | cargo check / cargo test 通过 | 完成 |

## 性能预期

- 同步 50 个文档总时间从 ~20s 降低到 ~5s 量级（约 4x 提升）
- manifest 磁盘写入减少约 80%
