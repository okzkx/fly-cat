## MODIFIED Requirements

### Requirement: 首页展示同步文档只读预览区

应用在知识库树主工作区 SHALL 提供右侧（或树旁）只读预览区域。当用户**通过树节点标题行（聚焦选择，而非仅切换同步复选框）**选中树中表示飞书文档的节点，且该文档在 manifest 中为成功同步并存在本地 Markdown 输出文件时，系统 SHALL 在预览区展示该文件内容的渲染结果（从磁盘读取的 Markdown，而非重新从飞书拉取）。**单独勾选或取消同步复选框 SHALL NOT 作为切换预览目标的充分条件。**

#### Scenario: Tauri 下已同步文档可选中预览

- **WHEN** 运行时为 Tauri，用户通过标题行聚焦选中某一文档节点，且 `document_id` 对应 manifest 记录 `status` 为成功且 `output_path` 文件存在
- **THEN** 预览区 SHALL 显示该 Markdown 渲染后的只读内容，并 SHALL 显示文档标题或路径等上下文信息

#### Scenario: 未同步或失败文档

- **WHEN** 用户通过标题行聚焦选中文档节点但该文档无成功同步记录或本地输出文件不存在
- **THEN** 预览区 SHALL 展示明确提示（例如「尚未同步」或「本地文件不存在」），且 SHALL 不假装已展示内容
