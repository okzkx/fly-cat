# Proposal: 修复同步文档内容排版缺失问题

## 变更名称
fix-content-formatting

## 变更动机
飞书文档同步到本地 Markdown 时，排版格式大量丢失。经过分析，根本原因是 `parse_block_from_json` 函数中的 `block_type` 枚举值映射与飞书 docx v1 API 的实际返回值不一致。

## 当前问题

### 1. block_type 枚举值完全错误

代码中的注释声明：`Block types: 1=text, 2=heading, 3=bullet list, 4=ordered list, 14=code, 17=todo, 22=table/divider, 24=quote, 27|28=image`

但飞书 docx v1 API 的实际 block_type 枚举是：

| block_type | 实际类型 | 代码错误映射 |
|---|---|---|
| 2 | text（文本块） | heading（标题） |
| 3 | heading1（一级标题） | bullet list（无序列表） |
| 4 | heading2（二级标题） | ordered list（有序列表） |
| 5-11 | heading3-9（三到九级标题） | 未处理 |
| 12 | bullet（无序列表） | 未处理 |
| 13 | ordered（有序列表） | 未处理 |
| 14 | code（代码块） | code（正确） |
| 15 | quote（引用块） | 未处理 |
| 16 | todo（待办事项） | 未处理 |
| 21 | divider（分割线） | 未处理 |
| 26 | image（图片） | 未处理（仅处理27/28） |
| 30 | table（表格） | 未处理（22被当作table） |

### 2. 标题级别解析逻辑错误

当前代码对 heading 块使用 `"heading"` 键和 `"style"` 字符串字段（如 "heading1"、"heading2"）。但飞书 API 的标题块使用 `"heading1"` 到 `"heading9"` 作为键名，每个标题级别是独立的 block_type（3-11）。

### 3. 列表项未合并

每个 bullet/ordered 块只包含单个列表项，连续的同类型列表项需要合并为一个 Markdown 列表。

## 变更范围

### 核心修改
1. `src-tauri/src/mcp.rs` - `parse_block_from_json` 函数
   - 修正所有 block_type 枚举值映射
   - 正确处理 heading1-heading9（block_type 3-11）
   - 正确处理 bullet（block_type 12）
   - 正确处理 ordered（block_type 13）
   - 正确处理 quote（block_type 15）
   - 正确处理 todo（block_type 16）
   - 正确处理 divider（block_type 21）
   - 正确处理 image（block_type 26）
   - 正确处理 table（block_type 30）

2. `src-tauri/src/mcp.rs` - 列表项合并逻辑
   - 在 `flatten_block_tree` 后或 `fetch_document_blocks` 后添加列表项合并步骤
   - 连续的 BulletList 合并为单个 BulletList
   - 连续的 OrderedList 合并为单个 OrderedList
   - 连续的 Todo 合并为单个 Todo

3. `src-tauri/src/mcp.rs` - 标题块解析
   - 对 block_type 3-11，使用对应的键名（heading1-heading9）
   - 从键名推导标题级别

### 测试修改
4. 更新现有测试用例中的 block_type 值
5. 新增标题级别 3-9 的测试
6. 新增列表项合并测试

## 影响范围
- 仅影响 Rust 后端的块解析逻辑
- 不影响前端代码
- 不影响 TypeScript 的 markdown-renderer.ts（它只是一个简化的 TypeScript 实现）
- render.rs 的渲染逻辑无需修改（已有完整的块类型支持）
