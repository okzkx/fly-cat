## Why

用户在知识库树中选择已同步文档时，需要快速查看本地 Markdown 同步结果，而无需离开应用或打开外部编辑器。当前仅能通过文件系统或任务列表间接确认产物，阅读流断裂。

## What Changes

- 在首页知识库树右侧增加只读 Markdown 预览区域，选中已同步文档时加载对应本地 `.md` 内容并渲染。
- Tauri 运行时通过后端命令读取 manifest 中的 `output_path` 与文件内容；浏览器模拟运行时显示明确降级提示（无法访问真实同步目录）。
- 预览渲染采用轻量 Markdown→HTML 管线，并对本地相对图片路径做 Tauri 可用的资源 URL 转换（参考 Long_MarkDownReader 中「只读预览 + 本地资源」思路，但不引入完整编辑器内核）。

## Capabilities

### New Capabilities

- `knowledge-doc-markdown-preview`: 定义首页文档预览区的可见性、数据来源（已同步 manifest）、运行时降级与图片资源加载期望。

### Modified Capabilities

- （无）本变更为独立预览子系统，不修改既有同步管线规格。

## Impact

- 前端：`HomePage` 布局、新建预览组件、运行时抽象 `tauriRuntime` / `browserTaskManager` 如有需要。
- 后端：`src-tauri` 新增只读命令（按 `document_id` + `sync_root` 读取 manifest 与 Markdown 文本）。
- 依赖：可选增加轻量 Markdown 与 HTML 消毒库（如 `marked` + `dompurify`）。
