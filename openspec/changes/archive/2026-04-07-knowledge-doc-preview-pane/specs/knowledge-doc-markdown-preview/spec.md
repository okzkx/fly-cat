## ADDED Requirements

### Requirement: 首页展示同步文档只读预览区

应用在知识库树主工作区 SHALL 提供右侧（或树旁）只读预览区域。当用户选中树中表示飞书文档的节点，且该文档在 manifest 中为成功同步并存在本地 Markdown 输出文件时，系统 SHALL 在预览区展示该文件内容的渲染结果（从磁盘读取的 Markdown，而非重新从飞书拉取）。

#### Scenario: Tauri 下已同步文档可选中预览

- **WHEN** 运行时为 Tauri，用户选中某一文档节点，且 `document_id` 对应 manifest 记录 `status` 为成功且 `output_path` 文件存在
- **THEN** 预览区 SHALL 显示该 Markdown 渲染后的只读内容，并 SHALL 显示文档标题或路径等上下文信息

#### Scenario: 未同步或失败文档

- **WHEN** 用户选中文档节点但该文档无成功同步记录或本地输出文件不存在
- **THEN** 预览区 SHALL 展示明确提示（例如「尚未同步」或「本地文件不存在」），且 SHALL 不假装已展示内容

### Requirement: 浏览器模拟运行时降级

当运行时为浏览器模拟（非 Tauri）时，应用 SHALL NOT 声称可读取用户本机同步目录中的 Markdown。预览区 SHALL 展示说明：完整预览仅在桌面版可用。

#### Scenario: 浏览器打开首页

- **WHEN** 用户在浏览器模式打开应用并选中文档节点
- **THEN** 预览区 SHALL 显示浏览器模式不可读取本地同步文件的说明，而非空白或报错堆栈

### Requirement: 本地图片相对路径在预览中可解析

对于 Markdown 中引用同步目录内相对路径图片（例如 `![](../_assets/...)`），在 Tauri 预览渲染结果中，系统 SHALL 将此类资源解析为 WebView 可加载的 URL（例如通过 `convertFileSrc` 或等价安全机制），使用户能在预览中看到图片。

#### Scenario: 相对路径图片

- **WHEN** 已同步 Markdown 含相对路径图片且目标文件存在于同步根下
- **THEN** 预览中对应图片元素 SHALL 成功显示

### Requirement: 后端只读查询接口

Tauri 后端 SHALL 提供命令（或等价 IPC），根据 `sync_root` 与 `document_id` 读取 manifest 并返回该文档的 Markdown 文本及输出文件路径（或明确错误）。该命令 SHALL 仅用于只读预览，SHALL NOT 修改 manifest 或同步状态。

#### Scenario: 非法或缺失参数

- **WHEN** 调用方传入未知 `document_id` 或文件不可读
- **THEN** 接口 SHALL 返回可展示给前端的错误信息，且 SHALL NOT 崩溃
