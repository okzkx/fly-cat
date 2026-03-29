# 变更报告：adopt-export-task-api

## 基本信息

| 项目 | 内容 |
|------|------|
| 变更名称 | adopt-export-task-api |
| 模式 | openspec-change/v1 |
| 归档路径 | openspec/changes/archive/2026-03-29-adopt-export-task-api/ |

## 变更动机

参考项目 feishu_docs_export 使用飞书 Export Task API，导出速度远快于当前项目的 raw_content 方案。当前方案每个文档需要 2 次网络请求 + 客户端 markdown 渲染，且丢失格式信息。Export Task API 让飞书服务端完成渲染，客户端只需下载完成的文件，速度和输出质量都更优。

## 变更范围

- 在 `FeishuOpenApiClient` 中新增 Export Task API 三方法：`create_export_task`、`get_export_task_status`、`download_export_file`
- 使用 `ureq::Agent` 实例实现 HTTP 连接复用（所有请求共享同一连接池）
- 新增 `sync_document_via_export` 函数作为主导出路径
- 新增 `default_extension` 文件类型映射函数（doc→docx, sheet→xlsx, bitable→xlsx）
- 修改并行处理循环：先尝试 Export Task，失败自动 fallback 到 raw_content 方案
- `SyncSourceDocument` 新增 `obj_type` 字段，在文档发现阶段记录原始类型
- 并发数从 4 提升到 8

## 规格影响

- `specs/sync-pipeline/spec.md`：新增 3 条 ADDED 需求（Export Task API、并发提升、连接复用）+ 1 条 MODIFIED 需求（并发 8）

## 任务完成情况

| # | 任务 | 状态 |
|---|------|------|
| 1 | 新增 Export Task API 结构体 | 完成 |
| 2 | 新增三个 Export Task API 方法 | 完成 |
| 3 | 使用 shared ureq::Agent 连接复用 | 完成 |
| 4 | 新增 sync_document_via_export 函数 | 完成 |
| 5 | 新增 default_extension 映射 | 完成 |
| 6 | 修改并行循环：export 优先 + fallback | 完成 |
| 7 | 并发数 4 → 8 | 完成 |
| 8 | cargo check/test 通过 (29 tests) | 完成 |

## 性能提升

- 每个文档：从 2 次 API 请求（raw_content）降至 3 次（创建任务→轮询→下载），但导出文件包含完整格式和内嵌图片
- 图片无需单独下载（内嵌在 docx/pdf 中）
- HTTP 连接复用减少 TCP 握手开销
- 并发数翻倍
