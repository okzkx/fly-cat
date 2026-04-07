## Context

首页 `HomePage` 以 Ant Design `Tree` 展示知识库与同步状态；同步产物为本地 Markdown 与 `_assets`，路径记录在 manifest 的 `output_path`。应用同时支持 Tauri 桌面与浏览器模拟运行时，后者无法安全读取用户磁盘上的同步根目录。

## Goals / Non-Goals

**Goals:**

- 在 Tauri 下，用户选中树中的文档节点时，右侧展示该文档已同步 Markdown 的只读预览。
- 复用 manifest 与现有落盘文件，不重复走飞书拉取与渲染主链路。
- 对 Markdown 中相对路径图片，在预览 HTML 中转换为 WebView 可加载的本地 URL（优先 `convertFileSrc`）。
- 浏览器模式下给出清晰说明，而非静默失败或伪造内容。

**Non-Goals:**

- 不引入完整 Markdown 编辑器（如 Vditor 编辑态）。
- 不在本变更中重做编码探测（chardet）；首版按 UTF-8 读取，失败时返回可读错误。
- 多维表格（bitable）等特殊导出格式不强制与 Markdown 预览一致，可显示无预览提示。

## Decisions

1. **后端只读命令**  
   新增 `read_synced_markdown_preview(sync_root, document_id)`：查 manifest，校验 `status == success` 且 `output_path` 指向存在文件，读取文本返回，同时返回 `output_path` 供前端解析相对资源。  
   *理由*：集中路径解析与存在性检查，避免前端重复 manifest 逻辑。

2. **前端渲染栈**  
   使用 `marked` 将 Markdown 转为 HTML，`dompurify` 消毒后注入容器；代码块依赖 marked 默认转义与高亮以外的朴素 `<pre><code>`。  
   *理由*：依赖面小于完整编辑器；与参考文档中「只读预览可拆轻量渲染器」一致。

3. **图片 URL**  
   在生成 HTML 后，用 DOMParser 遍历 `img[src]`：若为非网络绝对 URL，则按 Markdown 文件目录 `join` 绝对路径，Tauri 下 `convertFileSrc(absolutePath)`。  
   *理由*：对齐 Long_MarkDownReader「预览前改写资源路径」思路，且不注册自定义协议（最小改动）。

4. **布局**  
   `HomePage` 主卡片区域改为横向 flex：左侧树，右侧固定最小宽度的预览 Card；未选文档、未同步或非 Tauri 时展示 `Empty`/Alert。

## Risks / Trade-offs

- [大文件性能] → 首版全量读入字符串；后续可加分块或虚拟滚动。  
- [XSS] → 必须 DOMPurify；禁止跳过消毒。  
- [非 UTF-8 文档] → 可能乱码；记录为已知限制。  
- [浏览器模式] → 仅提示，不提供假数据。

## Migration Plan

纯前端与 Tauri 命令增量发布；无需数据迁移。回滚可移除命令注册与 UI 分栏。

## Open Questions

无。
