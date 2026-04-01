## ADDED Requirements

### Requirement: README 必须具备面向托管首页的导航结构

README.md SHALL 在正文前部提供指向主要章节的目录（TOC），链接为同一文件内的 Markdown 锚点，且与文中 `##` / `###` 标题一致。

#### Scenario: 读者从目录跳转

- **WHEN** 读者在 GitHub 默认 README 视图中点击目录中的章节链接
- **THEN** 页面跳转到对应标题位置且锚点与标题 slug 匹配

### Requirement: README 必须区分「面向最终用户」与「面向开发者」区块

README.md SHALL 将「安装与使用」「应用内流程说明」置于「开发环境」「构建与测试」之前；技术栈表格可紧随用户区块之后或按现有设计文档约定排列，但不得弱化安装与使用指引的存在。

#### Scenario: 新用户查找上手步骤

- **WHEN** 新用户打开 README.md 寻找如何安装与首次使用
- **THEN** 用户能在前部章节中找到分步的安装与使用说明，无需先阅读开发命令

### Requirement: README 中的发布物链接必须可解析

若 README 指引读者下载安装包，README.md SHALL 使用可公开解析的 Releases 地址（与仓库 `origin` 对应的 `https://github.com/<owner>/<repo>/releases`）或仓库内相对路径，不得使用在仓库根 README 下会跳出仓库树的 `../../releases` 等无效相对路径。

#### Scenario: 用户打开下载链接

- **WHEN** 用户点击 README 中的 Releases 下载指引链接
- **THEN** 链接指向有效的 Releases 页面或仓库内说明位置

### Requirement: README 必须如实说明视觉素材

若仓库未提供应用截图或演示 GIF，README.md SHALL 以简短文字说明「当前仓库未附截图」或引导读者本地运行查看界面，不得使用虚构截图路径或占位资源冒充已实现素材。

#### Scenario: 读者查找界面预览

- **WHEN** 读者寻找界面截图或演示
- **THEN** 读者能明确得知是否提供截图；若未提供，能获知如何自行启动应用查看
