## Context

当前飞书文档同步使用 `/raw_content` API，该 API 只返回纯文本内容，不包含结构化信息。图片在原始内容中被替换为纯文本占位符 `filename.png`，导致生成的 Markdown 文档丢失所有图片。

**当前代码流程**:
```
fetch_document()
  → /raw_content API (纯文本)
  → 按行分割为 Paragraph 块
  → 丢失图片信息
```

**目标代码流程**:
```
fetch_document()
  → /blocks API (结构化 JSON)
  → 解析 block_type 识别块类型
  → 图片块 (type=28) 提取 image.token 作为 media_id
  → 正确生成 Markdown 图片语法
```

## Goals / Non-Goals

**Goals:**
- 使用飞书块 API 获取结构化文档内容
- 正确解析图片块（block_type: 28）并提取 media_id
- 保持现有 RawBlock 枚举接口不变
- 确保图片下载流程继续正常工作

**Non-Goals:**
- 不重构整个同步架构
- 不支持所有飞书块类型（仅关注图片块）
- 不修改前端代码

## Decisions

### 决策 1: 使用块 API 替代 raw_content API

**选择**: 调用 `/docx/v1/documents/{document_id}/blocks/{document_id}` 获取文档根块，然后遍历子块

**替代方案**:
1. 继续使用 `/raw_content` + 正则匹配 `filename.png` → 无法获取 media_id，不可行
2. 使用导出 API 获取完整文档 → 格式转换复杂，已有代码可复用块解析

**理由**: 块 API 返回结构化 JSON，可直接识别图片块并提取 token 用于下载

### 决策 2: 块解析策略

**选择**: 实现 `parse_blocks_from_json()` 函数，解析飞书块 API 返回的 JSON 结构

**块类型映射**:
| block_type | RawBlock 变体 |
|------------|---------------|
| 1 | Paragraph |
| 2 | Heading (需要识别 heading_level) |
| 3 | Paragraph (列表项作为段落) |
| 4 | Paragraph (有序列表项作为段落) |
| 28 | Image { media_id: image.token, alt: "" } |
| 其他 | Paragraph (回退为纯文本) |

**理由**: 保持 RawBlock 枚举不变，最小化代码改动范围

### 决策 3: 图片 media_id 提取

**选择**: 从图片块的 `image.token` 字段提取 media_id

**飞书图片块结构**:
```json
{
  "block_type": 28,
  "image": {
    "token": "boxcnXXXXXX",
    "width": 800,
    "height": 600
  }
}
```

**理由**: `image.token` 是飞书图片资源的唯一标识，与现有的 `download_image()` 函数兼容

## Risks / Trade-offs

**[风险 1] 块 API 响应结构变化**
→ 缓解: 实现健壮的 JSON 解析，对未知块类型回退到 Paragraph 处理

**[风险 2] 分页处理**
→ 缓解: 块 API 可能返回大量子块，需要实现分页或限制处理数量

**[风险 3] 性能影响**
→ 缓解: 块 API 响应可能比 raw_content 大，但避免了后续的图片下载失败

**[取舍] 不支持所有块类型**
→ 影响: 复杂表格、代码块等可能解析不完整
→ 接受: 当前需求仅关注图片，后续可扩展
