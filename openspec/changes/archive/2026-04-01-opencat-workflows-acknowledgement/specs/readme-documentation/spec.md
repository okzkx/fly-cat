## ADDED Requirements

### Requirement: 展示文档须致谢 OpenCat 工作流上游插件

根目录 `README.md` 与 `README.zh-CN.md` SHALL 在介绍 OpenCat / OpenSpec 工作流的章节中，包含对上游插件仓库 **opencat-workflows** 的明确致谢，并 MUST 提供指向 `https://github.com/okzkx/opencat-workflows` 的可点击 Markdown 链接（或使用等价的 `[文本](URL)` 形式）。

#### Scenario: 读者从英文 README 找到上游仓库

- **WHEN** 读者阅读 `README.md` 中的 OpenCat 工作流相关章节
- **THEN** 读者能看到说明技能来源于 opencat-workflows 插件仓库的表述，并能通过链接打开该 GitHub 仓库

#### Scenario: 读者从中文说明找到上游仓库

- **WHEN** 读者阅读 `README.zh-CN.md` 中的 OpenCat 工作流相关章节
- **THEN** 读者能看到与英文 README 语义一致的上游致谢与同一仓库链接
