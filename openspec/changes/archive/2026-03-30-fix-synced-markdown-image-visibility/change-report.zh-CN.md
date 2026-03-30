## 基本信息

- 变更名称：`fix-synced-markdown-image-visibility`
- Schema：`spec-driven`
- 归档日期：`2026-03-30`
- 归档前分支：`opencat/fix-synced-markdown-image-visibility`

## 变更动机

当前同步链路会把包含图片的飞书文档标记为同步成功，但本地 Markdown 仍然可能看不到任何图片。实际排查中，样例 `C:\Users\zengkaixiang\Documents\synced-docs\ProjectStorm\美术模块\动画\死锁动画.md` 只有文本内容，而本地 `.feishu-sync-manifest.json` 对应记录的 `imageAssets` 也为空，说明图片块在抓取或落盘阶段被遗漏了。

## 变更范围

- 递归遍历 Feishu 文档块树，补齐对嵌套 descendant blocks 的抓取，避免只读取根块直接子节点而漏掉图片块。
- 将 OpenAPI 图片资源从“返回需要鉴权的远程 URL”改为“下载媒体二进制并返回扩展名”，让本地 Markdown 可以稳定引用本地图片。
- 将图片资源统一写入同步根目录下固定的 `_assets` 目录，并生成从文档目录到该资源的相对路径。
- 补充 Rust 回归测试，覆盖嵌套块扁平化、图片扩展名推断、本地图片链接渲染和同步写盘结果。

## 规格影响

- 修改能力：`mcp-markdown-content-pipeline`
- 修改能力：`sync-image-resolution-and-fallback`
- 本次归档未同步 delta specs 回主规格，保持现有仓库归档习惯，仅保留变更记录与实现结果。

## 任务完成情况

- `1.1` 已完成：递归抓取 descendant blocks 并按深度优先顺序扁平化。
- `1.2` 已完成：新增嵌套块遍历回归测试。
- `2.1` 已完成：OpenAPI 图片改为走媒体下载接口返回本地二进制。
- `2.2` 已完成：本地图片统一写入同步根 `_assets`，Markdown 链接改为正确相对路径并保留稳定扩展名。
- `3.1` 已完成：运行 Rust 测试、编译检查。
- `3.2` 已完成：重新核对样例本地输出与 manifest 证据，确认修复目标与现状一致。

## 验证结果

- `cargo test --manifest-path "src-tauri/Cargo.toml"`：通过，`32` 项测试全部成功。
- `cargo check --manifest-path "src-tauri/Cargo.toml"`：通过。
- `cargo fmt --manifest-path "src-tauri/Cargo.toml"`：完成。

## 风险与备注

- `cargo fmt` 对 `src-tauri` crate 产生了额外机械格式化改动，本次随 apply 提交一并纳入，以保持 worktree 干净可归档。
- 本次未直接触发真实样例文档重新同步，因此最终可见性仍依赖后续实际同步运行来验证端到端效果；但代码路径与本地证据已对齐。
