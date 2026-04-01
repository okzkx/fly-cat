## Context

根目录 `README.md` 已覆盖功能、技术栈、开发与 OAuth 配置；托管在 GitHub 时读者习惯先看到一句话定位、要点列表、上手步骤与目录跳转。

## Goals / Non-Goals

**Goals:**

- 用最小改动调整标题与段落顺序，贴近常见开源仓库首页的信息架构。
- 内链指向仓库内真实路径；对外链使用已存在的官方文档 URL。
- 不编造未实现功能；无应用截图时明确用文字说明而非占位假图。

**Non-Goals:**

- 不引入 CI badge、下载统计等需外部服务或虚构数据的展示元素。
- 不新增独立中文文档文件（本变更范围仅限根 README；TODO 中「中文文档」为后续项）。

## Decisions

- **结构**：采用「标题 + 简短说明」开场，紧跟 **功能亮点**、**适用场景 / 使用流程**、**快速开始**（安装/使用分步）、**目录**（TOC）、再保留 **技术栈**、**开发**、**OpenCat**、**项目结构**、**许可证**。
- **Releases 链接**：使用与 `origin` 一致的 GitHub Releases 绝对地址 `https://github.com/okzkx/fly-cat/releases`，避免 `../../releases` 在仓库根 README 渲染时失效。

## Risks / Trade-offs

- 绝对 GitHub URL 在镜像克隆场景下可能指向原站；接受该取舍以保持默认 GitHub 展示体验。
