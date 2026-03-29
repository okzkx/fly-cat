# Design: adopt-export-task-api

## Approach

### 1. Export Task API 集成

在 `mcp.rs` 的 `FeishuOpenApiClient` 中新增三个方法：

```rust
pub fn create_export_task(&self, token: &str, file_extension: &str, file_type: &str) -> Result<ExportTaskResponse, McpError>
pub fn get_export_task_status(&self, ticket: &str, token: &str) -> Result<ExportTaskStatus, McpError>
pub fn download_export_file(&self, file_token: &str) -> Result<Vec<u8>, McpError>
```

API 端点：
- `POST /drive/v1/export_tasks` - 创建导出任务
- `GET /drive/v1/export_tasks/{ticket}?token={token}` - 查询状态
- `GET /drive/v1/export_tasks/file/{file_token}/download` - 下载文件

### 2. 导出流程

```
sync_document_via_export(document, sync_root, openapi_config):
  1. 确定文件类型和扩展名 (doc→docx, sheet→xlsx, bitable→xlsx)
  2. create_export_task(obj_token, extension, type)
  3. 轮询 get_export_task_status 直到 job_status == 0 (间隔 1s, 最多 60s)
  4. download_export_file(file_token) 获取二进制数据
  5. 写入磁盘 (保持原始目录结构)
  6. 返回 ManifestRecord
```

### 3. Fallback 策略

在 `commands.rs` 的并行处理循环中：
- 优先尝试 `sync_document_via_export`
- 如果 Export Task 失败（权限不足、API 错误等），fallback 到 `sync_document_content`
- 记录使用的是哪种方式，便于后续分析

### 4. HTTP 连接复用

当前每次 `ureq::get()` 都使用默认全局 Agent，每个线程共享同一连接池。但 FeishuOpenApiClient 每次创建新实例，没有复用 Agent。

改进：在 `FeishuOpenApiClient` 中存储一个 `ureq::Agent`，所有请求通过同一个 Agent 发出：
```rust
pub struct FeishuOpenApiClient {
    config: FeishuOpenApiConfig,
    agent: ureq::Agent,
}
```

### 5. 并发提升

将 concurrency 从 4 提升到 8，配合 Export Task API 的低请求数量，整体吞吐量大幅提升。

### 6. 数据模型变化

需要新增：
- `ExportTaskResponse` 结构体
- `ExportTaskStatus` 结构体
- `ExportTaskResult` 结构体

ManifestRecord 中的 `output_path` 需要支持不同扩展名（不再都是 .md）。

### 7. 文件扩展名映射

```rust
fn default_extension(obj_type: &str) -> &str {
    match obj_type {
        "doc" | "docx" => "docx",
        "sheet" | "bitable" => "xlsx",
        "mindnote" => "pdf",
        _ => "pdf",
    }
}
```
