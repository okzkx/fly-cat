## 1. Tauri 后端

- [ ] 1.1 新增 `read_synced_markdown_preview` 命令：按 manifest 读取指定 `document_id` 的 Markdown 文本与 `output_path`
- [ ] 1.2 在 `lib.rs` 注册命令并处理错误路径（无记录、非文件、读失败）

## 2. 运行时抽象与依赖

- [ ] 2.1 在 `tauriRuntime` 暴露预览读取；浏览器模式返回固定降级结果
- [ ] 2.2 添加 `marked`、`dompurify` 及类型依赖

## 3. 前端 UI

- [ ] 3.1 实现 `MarkdownPreviewPane`：渲染、消毒、Tauri 下图片 `convertFileSrc` 改写
- [ ] 3.2 调整 `HomePage` 为左右分栏：树 + 预览区，随选中同步文档加载内容

## 4. 验证

- [ ] 4.1 运行 `npm run typecheck` 与 `cargo check`（或 `tauri build` 前置检查）
