# adopt-export-task-api

## Motivation

参考项目 `feishu_docs_export` 使用飞书 Export Task API 导出文档，速度远快于当前项目的 raw_content 方案。

**根因**: 当前项目使用 `/docx/v1/documents/{id}/raw_content` API 获取纯文本，然后客户端渲染 markdown。这种方式：
1. 每个文档需要 2 次网络请求（文档信息 + 原始内容）
2. 图片需要单独下载
3. raw_content 返回的是纯文本行，丢失了所有格式信息（标题、列表、表格等）
4. 客户端渲染 markdown 质量差

**参考项目方案**: 使用 `/drive/v1/export_tasks` API，让飞书服务端完成文档渲染和格式转换：
1. 创建导出任务（1 次请求）
2. 轮询等待完成（1-3 次请求）
3. 下载完成的文件（1 次请求）
4. 图片内嵌在导出文件中，无需单独处理
5. 输出 docx/xlsx/pdf，格式完整保留

## Scope

- 在 `FeishuOpenApiClient` 中新增 Export Task API 三个方法：`create_export_task`、`get_export_task_status`、`download_export_file`
- 新增 `sync_document_via_export` 函数作为主要导出路径
- 保留现有 `sync_document_content` 作为 fallback
- 输出文件扩展名映射：doc/docx → .docx, sheet/bitable → .xlsx, mindnote → .pdf
- 增加 HTTP 连接复用：使用 ureq Agent 替代全局请求
- 提高并发数到 8

## Out of Scope

- 不修改前端 UI
- 不改变 manifest 数据结构
- 不引入新依赖（继续使用 ureq）
- 不实现 Export Task 的重试队列（失败直接 fallback）

## Success Criteria

- 文档导出速度达到参考项目水平（每个文档 3 次网络请求）
- 输出的 docx/xlsx/pdf 文件格式完整，图片内嵌
- Export Task 失败时自动 fallback 到 raw_content 方案
- 现有测试继续通过
