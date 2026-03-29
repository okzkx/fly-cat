## 基本信息

- 变更名称：`fix-image-filename-png`
- Schema：`spec-driven`
- 创建日期：`2026-03-30`
- 归档路径：`openspec/changes/archive/2026-03-30-fix-image-filename-png`

## 变更动机

当前飞书文档同步功能使用 `/raw_content` API，该 API 只返回纯文本内容，导致文档中的图片在 Markdown 中显示为纯文本占位符 `filename.png`，而不是正确的图片语法。用户同步的知识库文档因此丢失了所有图片内容，严重影响文档可用性。

## 变更范围

- 修改 `fetch_document` 方法：从使用 `/raw_content` API 改为使用飞书块 API (`/docx/v1/documents/{document_id}/blocks/{block_id}`)
- 增强块解析逻辑：正确解析飞书返回的结构化块数据，识别 `block_type: 28` 为图片块
- 提取图片 media_id：从图片块的 `image.token` 字段获取 `media_id`，用于后续图片下载
- 保持向后兼容：对于无法解析的块类型，回退到纯文本处理

## 规格影响

- 新增能力：`feishu-block-api-integration` - 飞书文档块 API 集成，支持获取结构化的文档块数据并解析图片块
- 修改能力：`mcp-markdown-content-pipeline` - 修改文档内容获取方式，从 `/raw_content` API 改为块 API

## 任务完成情况

- 核心功能已完成并合并到 master
- Git 提交：`c541909 [apply] fix-image-filename-png: 使用飞书块 API 替代 raw_content api，修复图片显示问题`
- 合并提交：`44ce61d Merge branch 'opencat/fix-image-filename-png'`

## 验证结果

- 包含图片的飞书文档可以正确同步
- 生成的 Markdown 包含正确的图片语法
- 图片下载流程正常工作
