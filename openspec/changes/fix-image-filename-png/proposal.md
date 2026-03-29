## Why

当前飞书文档同步功能使用 `/raw_content` API，该 API 只返回纯文本内容，导致文档中的图片在 Markdown 中显示为纯文本占位符 `filename.png`，而不是正确的图片语法。用户同步的知识库文档因此丢失了所有图片内容，严重影响文档可用性。

## What Changes

- **修改 `fetch_document` 方法**：从使用 `/raw_content` API 改为使用飞书块 API (`/docx/v1/documents/{document_id}/blocks/{block_id}`)
- **增强块解析逻辑**：正确解析飞书返回的结构化块数据，识别 `block_type: 28` 为图片块
- **提取图片 media_id**：从图片块的 `image.token` 字段获取 `media_id`，用于后续图片下载
- **保持向后兼容**：对于无法解析的块类型，回退到纯文本处理

## Capabilities

### New Capabilities

- `feishu-block-api-integration`: 飞书文档块 API 集成，支持获取结构化的文档块数据并解析图片块

### Modified Capabilities

- `mcp-markdown-content-pipeline`: 修改文档内容获取方式，从 `/raw_content` API 改为块 API，增强对图片块的支持

## Impact

**代码影响**:
- `src-tauri/src/mcp.rs` - `fetch_document` 方法重构，新增块 API 调用和解析逻辑
- `src-tauri/src/model.rs` - 可能需要扩展 `RawBlock` 枚举以支持更多块类型

**API 影响**:
- 新增调用 `/docx/v1/documents/{document_id}/blocks/{block_id}` 端点
- 依赖飞书块 API 的响应结构

**依赖影响**:
- 无新增外部依赖
- 飞书块 API 返回结构需与官方文档一致
