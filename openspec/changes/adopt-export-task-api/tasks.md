# Tasks: adopt-export-task-api

## Tasks

- [ ] 1. 在 mcp.rs 新增 Export Task API 相关结构体 (ExportTaskResponse, ExportTaskStatus, ExportTaskResult)
- [ ] 2. 在 FeishuOpenApiClient 中新增 create_export_task, get_export_task_status, download_export_file 方法
- [ ] 3. 在 FeishuOpenApiClient 中使用 shared ureq::Agent 实现连接复用
- [ ] 4. 在 sync.rs 新增 sync_document_via_export 函数 (Export Task 主路径)
- [ ] 5. 在 sync.rs 新增 default_extension 映射函数
- [ ] 6. 修改 commands.rs 并行处理循环：先尝试 Export Task，失败 fallback 到 raw_content
- [ ] 7. 提高并发数从 4 到 8
- [ ] 8. 运行 cargo check / cargo test 确认编译和测试通过
