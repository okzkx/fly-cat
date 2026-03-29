## 1. 块 API 调用基础设施

- [ ] 1.1 在 `mcp.rs` 中添加 `fetch_document_blocks()` 方法，调用飞书块 API `/docx/v1/documents/{document_id}/blocks/{document_id}`
- [ ] 1.2 定义块 API 响应的 JSON 解析结构（用于 serde 反序列化）
- [ ] 1.3 处理块 API 分页逻辑（如果子块数量超过 page_size）

## 2. 块类型解析

- [ ] 2.1 实现 `parse_block_from_json()` 函数，将飞书块 JSON 转换为 RawBlock 枚举
- [ ] 2.2 解析图片块 (block_type: 28)，提取 `image.token` 作为 media_id
- [ ] 2.3 解析标题块 (block_type: 2)，提取 heading_level 和文本
- [ ] 2.4 解析文本块 (block_type: 1) 和列表块 (block_type: 3, 4)
- [ ] 2.5 为未知块类型实现回退逻辑，创建 Paragraph 块避免数据丢失

## 3. 重构 fetch_document 方法

- [ ] 3.1 修改 `fetch_document()` 方法，使用新的 `fetch_document_blocks()` 替代 `/raw_content` API
- [ ] 3.2 确保返回的 RawDocument 包含正确解析的 blocks 向量
- [ ] 3.3 保持方法签名不变，确保向后兼容

## 4. 测试与验证

- [ ] 4.1 使用包含图片的飞书文档测试同步功能
- [ ] 4.2 验证生成的 Markdown 包含正确的图片语法 `![alt](path)`
- [ ] 4.3 验证图片下载流程正常工作（使用提取的 media_id）
- [ ] 4.4 测试边界情况：无图片文档、空文档、无效 document_id
