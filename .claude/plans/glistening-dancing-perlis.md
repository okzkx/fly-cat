# 飞书文档同步质量修复计划

## Context

同步下来的 Markdown 文档与飞书在线文档差异很大，具体表现为：
1. **有序/无序列表丢失格式** — 编号和列表标记被去掉，变成纯文本
2. **大量内容缺失** — 部分段落完全丢失
3. **富文本样式丢失** — 粗体、斜体、链接等全部被剥离
4. **不支持的块类型** — 代码块、表格、引用等未处理

根因在 `mcp.rs` 的 `parse_block_from_json` 和 `render.rs` 的 `render_markdown`。

## 实施计划

修改后将更新 `TODO.md` 为以下内容（退出计划模式后执行）：

```markdown
# TODO

## P1 — 文档同步质量修复

- [ ] T1: 扩展 RawBlock/CanonicalBlock 枚举，新增 OrderedList、BulletList、CodeBlock、Quote、Table 变体
  - 文件: `src-tauri/src/mcp.rs` (RawBlock), `src-tauri/src/model.rs` (CanonicalBlock)
- [ ] T2: 修复有序列表渲染 — parse_block_from_json 中 type 4 输出 OrderedList，render_markdown 输出 `1. 2. 3.`
  - 文件: `src-tauri/src/mcp.rs:508`, `src-tauri/src/render.rs:94`
- [ ] T3: 修复无序列表渲染 — parse_block_from_json 中 type 3 输出 BulletList，render_markdown 输出 `- `
  - 文件: `src-tauri/src/mcp.rs:508`, `src-tauri/src/render.rs:94`
- [ ] T4: 支持代码块 — block type 14，提取 language 和 code 内容，输出 ``` 围栏
  - 文件: `src-tauri/src/mcp.rs`, `src-tauri/src/render.rs`
- [ ] T5: 支持引用块 — block type 24 (quote_container)，输出 `> ` 前缀
  - 文件: `src-tauri/src/mcp.rs`, `src-tauri/src/render.rs`
- [ ] T6: 支持表格 — block type 22 (table)，提取单元格输出 Markdown 表格
  - 文件: `src-tauri/src/mcp.rs`, `src-tauri/src/render.rs`
- [ ] T7: 支持分割线 — block type 22 (divider)，输出 `---`
  - 文件: `src-tauri/src/mcp.rs`, `src-tauri/src/render.rs`
- [ ] T8: 支持待办列表 — block type 17 (task/todo)，输出 `- [ ]` / `- [x]`
  - 文件: `src-tauri/src/mcp.rs`, `src-tauri/src/render.rs`

## P1 — 文本样式保留

- [ ] T9: 重构 extract_text_from_elements，支持粗体/斜体/删除线/链接
  - 新增 RichText 结构体替代纯 String
  - 文件: `src-tauri/src/mcp.rs:564`
- [ ] T10: render_markdown 输出 Markdown 内联样式 (**bold**, *italic*, ~~strike~~, [link](url))
  - 文件: `src-tauri/src/render.rs`

## P1 — 内容缺失修复

- [ ] T11: 修复 Block API 分页截断 — fetch_document_blocks 对 root block 的 children 实现分页遍历
  - 当前 page_size=500 可能不够，需检查 has_more 并循环获取
  - 文件: `src-tauri/src/mcp.rs:891-936`
- [ ] T12: 增强子块限频恢复 — 提高 retry 次数和退避时间，记录跳过的块
  - 当前 4 次 / 250ms 可能不够，改为 6 次 / 500ms
  - 文件: `src-tauri/src/mcp.rs:896-899`

## P2

- 点击文档可以预览文档
```

## 关键文件

| 文件 | 修改内容 |
|------|----------|
| `src-tauri/src/mcp.rs` | RawBlock 枚举、parse_block_from_json、extract_text_from_elements、fetch_document_blocks 分页 |
| `src-tauri/src/model.rs` | CanonicalBlock 枚举新增变体 |
| `src-tauri/src/render.rs` | render_markdown 支持列表/代码/引用/表格/富文本渲染 |
| `TODO.md` | 写入上述任务清单 |

## 验证方式

1. `cargo test` — 确保现有测试通过
2. 为每个新块类型添加单元测试
3. 重新同步 "使用 Mixamo" 文档，对比本地输出与飞书在线内容
4. 检查有序列表编号、代码块围栏、图片引用是否正确
