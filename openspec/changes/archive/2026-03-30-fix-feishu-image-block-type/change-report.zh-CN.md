## 变更摘要

修复飞书文档图片块类型识别错误。当前同步链路只把 `block_type=28` 识别为图片块，但实际 Feishu MCP 和线上文档块返回的是 `block_type=27`，导致图片在解析阶段被丢弃，最终 Markdown 中没有图片语法，也不会生成本地图片资产。

## 代码修改

- 更新 `src-tauri/src/mcp.rs`，让图片块解析兼容 `27 | 28`
- 修正文档注释，和当前 Feishu block 类型保持一致
- 新增针对 `block_type=27` 的解析回归测试
- 将嵌套块遍历测试中的图片 fixture 更新为真实 block type
- 同步更新 `openspec/specs/mcp-markdown-content-pipeline/spec.md`

## 验证

- `cargo test --manifest-path src-tauri/Cargo.toml mcp::tests`
- `cargo test --manifest-path src-tauri/Cargo.toml sync::tests::syncs_document_to_disk_and_updates_manifest`

## 结果

修复后，只要 Feishu 文档块返回 `image.token`，现有渲染与图片落盘链路就能继续工作，后续重新同步文档时应生成正确的 Markdown 图片引用和本地图片资源。
