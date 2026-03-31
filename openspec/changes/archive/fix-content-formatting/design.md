# Design: 修复同步文档内容排版缺失问题

## 架构概述

本变更修改 Rust 后端 `mcp.rs` 中的 `parse_block_from_json` 函数，使其正确映射飞书 docx v1 API 的 block_type 枚举值。

## 详细设计

### 1. block_type 枚举值修正

将当前的硬编码 match 分支替换为正确的枚举值映射：

```
旧的 block_type 映射:
1  -> text (正确)
2  -> heading (错误 - 应为 text)
3  -> bullet (错误 - 应为 heading1)
4  -> ordered (错误 - 应为 heading2)
14 -> code (巧合正确)
17 -> todo (错误 - 应为 bitable)
22 -> table/divider (错误)
24 -> quote (错误 - 应为 grid_column)
27|28 -> image (部分错误)

新的 block_type 映射:
2  -> text（文本块）
3  -> heading1（一级标题）
4  -> heading2（二级标题）
5  -> heading3（三级标题）
6  -> heading4（四级标题）
7  -> heading5（五级标题）
8  -> heading6（六级标题）
9  -> heading7（七级标题）
10 -> heading8（八级标题）
11 -> heading9（九级标题）
12 -> bullet（无序列表）
13 -> ordered（有序列表）
14 -> code（代码块）
15 -> quote（引用块）
16 -> todo（待办事项）
21 -> divider（分割线）
26 -> image（图片）
30 -> table（表格）
```

### 2. 标题块解析改进

对 block_type 3-11 的标题块，使用对应的键名 `heading1` - `heading9`：

```rust
3..=11 => {
    // heading1 to heading9
    let level = (block_type - 2) as u8; // 3->1, 4->2, ..., 11->9
    let key = format!("heading{}", level);
    let heading = block.get(&key);
    // ... extract text from heading.elements
}
```

### 3. 列表项合并

在 `fetch_document_blocks` 返回后，添加列表项合并步骤：

```rust
fn merge_consecutive_list_blocks(blocks: Vec<RawBlock>) -> Vec<RawBlock> {
    // 连续的 BulletList 合并
    // 连续的 OrderedList 合并
    // 连续的 Todo 合并
}
```

### 4. 文本块处理

block_type 1 是 page 块（文档根块），不包含文本内容。block_type 2 才是文本块：
```rust
2 => {
    // text block - key is "text"
    let text = extract_text_from_block(block);
    ...
}
```

### 5. 图片块处理

block_type 26 对应图片，使用键名 `"image"`：
```rust
26 => {
    let image = block.get("image");
    let media_id = image.and_then(|i| i.get("token")).and_then(|t| t.as_str());
    ...
}
```

### 6. 表格块处理

block_type 30 对应表格，使用键名 `"table"`：
```rust
30 => {
    let table_block = block.get("table");
    // extract cells...
}
```

## 向后兼容性

- 旧代码中 block_type 1 被当作 text 处理。实际上 block_type 1 是 page 块，通常不会出现在子块列表中（它是文档根块）。修改后 block_type 1 将被忽略或当作未知块处理。
- block_type 2 的正确映射是 text，而不是 heading。这意味着以前被当作 heading 的块现在会被正确处理为文本。
- 所有测试数据中的 block_type 值需要更新。

## 测试策略

1. 单元测试：为每个 block_type 编写解析测试
2. 集成测试：验证完整的文档同步流程
3. 使用示例文档（使用 Mixamo.md）进行端到端验证
