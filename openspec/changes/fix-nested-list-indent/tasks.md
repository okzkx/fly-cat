## 1. 实现

- [ ] 1.1 在 `model.rs` 增加 `ListItem`，`OrderedList`/`BulletList` 使用 `Vec<ListItem>`
- [ ] 1.2 `mcp.rs`：`parse_block_from_json(block, list_depth)`；`flatten_block_tree` 传递深度；合并逻辑扩展 `ListItem`
- [ ] 1.3 `render.rs`：按 `indent` 渲染有序（每深度独立计数）与无序列表
- [ ] 1.4 `sync.rs`：`normalize_block` 适配新结构
- [ ] 1.5 更新/新增单元测试覆盖嵌套有序列表

## 2. 验证

- [ ] 2.1 `openspec validate --change fix-nested-list-indent`
- [ ] 2.2 `cargo test`（`src-tauri`）
