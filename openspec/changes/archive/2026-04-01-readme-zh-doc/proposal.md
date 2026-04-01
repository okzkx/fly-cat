## Why

中文读者希望在不离开仓库的前提下快速了解飞猫助手，并能从英文 README 一键进入中文说明。当前仅有英文主 README，缺少对等的中文入口与阅读路径。

## What Changes

- 新增根目录中文说明文档（与 `README.md` 信息对齐，不夸大未实现能力）。
- 在 `README.md` 目录与正文前部增加显式中文文档跳转入口（相对链接，GitHub 可解析）。

## Capabilities

### New Capabilities

（无独立新能力规格；行为归入既有 `readme-documentation` 的扩展要求。）

### Modified Capabilities

- `readme-documentation`: 增补「中英文入口」与「中文说明文档存在且可从 README 到达」相关要求。

## Impact

- 根目录新增一个 Markdown 文件；`README.md` 增加导航链接。
- 无代码或依赖变更。
