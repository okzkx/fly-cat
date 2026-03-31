## Context

`flatten_block_tree` 按前序遍历把块树展平，随后 `merge_consecutive_list_blocks` 合并连续同类型列表块。嵌套列表项在展平后仍连续出现且类型相同，被合并进同一 `Vec<RichText>`，渲染时全部使用同一列 `1. 2. 3.`，丢失层级。

## Goals

- 保留飞书块树中「列表项之下的子块更深一层」的语义。
- 不引入破坏性 API：顶层项 `indent == 0`，与旧数据语义一致。

## Non-goals

- 待办列表（todo）的嵌套缩进（本变更不扩展 Todo 项结构）。
- 前端 `markdown-renderer.ts` 的 payload 形态（同步写文件走 Rust 管道）。

## Decisions

1. **深度来源**：在 `flatten_block_tree` 中传入 `list_depth`（根为 0）。每解析一个 `block_type` 为 12（bullet）或 13（ordered）的块，生成带 `indent: list_depth` 的单项列表块；递归其子块时，若当前块为列表项（12/13/17），则子遍历使用 `list_depth + 1`，否则保持 `list_depth`（与现有子树顺序一致）。
2. **模型**：新增 `ListItem { indent: u8, text: RichText }`，`OrderedList` / `BulletList` 的 `items` 改为 `Vec<ListItem>`。
3. **Markdown 输出**：
   - 无序：每行前导 `indent * 4` 个空格 + `- ` + 正文。
   - 有序：每行前导 `indent * 4` 个空格 + 该深度下的递增序号 + `. ` + 正文；深度变化时截断/扩展各深度计数器（与常见 Markdown 预览器行为一致）。

## Risks

- 若飞书将来对非树形子块顺序有变，深度推断可能需与 API 字段对齐；当前以最保守的树深度为准。
