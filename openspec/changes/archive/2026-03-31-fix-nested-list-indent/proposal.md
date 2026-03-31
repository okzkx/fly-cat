## Why

飞书文档中嵌套的有序/无序列表在同步为 Markdown 时，子项与父项被展平后合并为同一层列表，输出缺少缩进，二级编号与一级对齐，阅读层次错乱。

## What Changes

- 在块树遍历时为每个 bullet/ordered 列表项记录嵌套深度（基于父列表项子树）。
- 扩展有序/无序列表的 canonical 模型，使每项携带 `indent` 深度。
- `render_markdown` 按深度输出前导空格，有序列表按深度维护独立递增编号。

## Capabilities

### New Capabilities

（无；在既有管道能力上增量规定列表输出行为。）

### Modified Capabilities

- `mcp-markdown-content-pipeline`: 增补「嵌套列表在 Markdown 中保持层级缩进与编号」的需求与场景。

## Impact

- `src-tauri/src/model.rs`：`ListItem`、列表块结构。
- `src-tauri/src/mcp.rs`：`parse_block_from_json`、`flatten_block_tree`、`merge_consecutive_list_blocks` 及测试。
- `src-tauri/src/render.rs`：有序/无序列表渲染与测试。
- `src-tauri/src/sync.rs`：`normalize_block` 映射。
