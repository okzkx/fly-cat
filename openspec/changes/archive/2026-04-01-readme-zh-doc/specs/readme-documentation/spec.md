## ADDED Requirements

### Requirement: README 必须提供中文说明文档入口

README.md SHALL 在读者可见的前部（目录或紧随其后的简短说明）包含指向仓库内中文说明文档的 Markdown 链接；链接 MUST 使用自 `README.md` 起算的相对路径，且在 GitHub 默认 README 渲染下可点击到达目标文件。

#### Scenario: 读者从英文 README 进入中文说明

- **WHEN** 读者在托管平台打开根目录 README.md
- **THEN** 读者能看到指向中文说明文档的链接，且点击后打开对应 Markdown 文件视图

### Requirement: 中文说明文档必须与英文 README 事实一致

仓库根目录 SHALL 存在独立的中文说明文档（例如 `README.zh-CN.md`），其描述的产品名称、核心能力、安装与使用步骤、技术栈与开发命令 MUST 与当前 `README.md` 及仓库实际行为一致，不得宣称仓库中不存在的功能。

#### Scenario: 中文读者核对能力描述

- **WHEN** 读者阅读中文说明文档中的功能与使用流程
- **THEN** 所述内容均能在当前应用与英文 README 中找到对应依据
