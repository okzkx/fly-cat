## Context

根目录 `README.md` 与 `README.zh-CN.md` 已包含 OpenCat 工作流说明，但未指向上游插件仓库。任务要求在展示文档中补充对 [opencat-workflows](https://github.com/okzkx/opencat-workflows) 的致谢。

## Goals / Non-Goals

**Goals:**

- 在 OpenCat 章节内以独立小节呈现致谢，含可点击的 GitHub 链接（`https://github.com/okzkx/opencat-workflows`）。
- 中英文 README 同步更新；目录锚点一致。

**Non-Goals:**

- 不修改插件安装方式、不增加 CI badge 或版本号同步机制。

## Decisions

- **放置位置**：放在「OpenCat 工作流」章节内、现有子节（环境检查、主工作流等）之后，作为「致谢 / Acknowledgement」小节，避免打断既有步骤说明。
- **链接形式**：使用 Markdown 绝对 URL，与仓库 `README` 中 Releases 链接风格一致，便于托管页直接解析。

## Risks / Trade-offs

- [镜像克隆读者看到 github.com 链接] → 与现有 Releases 外链策略一致，可接受。
