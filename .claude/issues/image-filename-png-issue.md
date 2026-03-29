# 问题：飞书文档图片显示为 "filename.png"

> 发现日期: 2026-03-29
> 状态: 待修复

---

## 现象

同步下来的飞书 Markdown 文档中，图片位置显示为纯文本 `filename.png`，而不是正确的 Markdown 图片语法 `![alt](path)`。

**示例** (`死锁动画.md`)：
```markdown
正常姿态 : 1 帧

filename.png

准备姿态, 7 帧

filename.png
```

---

## 根本原因

**当前代码使用飞书 `/raw_content` API，只返回纯文本，不包含结构化块数据。**

### 代码位置

`src-tauri/src/mcp.rs` 第 591-631 行：

```rust
let raw_value = call_openapi_json(
    self.agent.get(&self.endpoint(&format!("/docx/v1/documents/{document_id}/raw_content")))
        ...
);

let blocks = raw_text
    .lines()
    .filter(|line| !line.trim().is_empty())
    .map(|line| RawBlock::Paragraph { text: line.to_string() })  // 所有行都变成 Paragraph
    .collect::<Vec<_>>();
```

### 问题链路

```
飞书文档
    ↓
/raw_content API (只返回纯文本)
    ↓
图片变成文本占位符 "filename.png"
    ↓
代码把每行当作 Paragraph 处理
    ↓
Markdown 输出纯文本 "filename.png"
```

---

## 解决方案

改用飞书 **块 API** (`/docx/v1/documents/{document_id}/blocks/{block_id}`)：

1. 获取结构化的块数据
2. 解析 `block_type: 28` 为图片块
3. 提取 `image.token` 作为 `media_id`
4. 下载图片并保存到本地

### 飞书块类型参考

| block_type | 类型 |
|------------|------|
| 1 | 文本 |
| 2 | 标题 |
| 3 | 无序列表 |
| 4 | 有序列表 |
| 28 | 图片 |

---

## 相关文件

- `src-tauri/src/mcp.rs` - API 调用和块解析
- `src-tauri/src/model.rs` - RawBlock 定义
- `src-tauri/src/render.rs` - Markdown 渲染

---

## 参考

- [飞书文档块 API 文档](https://open.feishu.cn/document/server-docs/docs/docs/docx-v1/document-block/get)