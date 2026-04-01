## Why

根目录 `README.md` 当前信息完整但版式偏传统文档，不利于在 GitHub 等托管页上一眼抓住项目价值与上手路径。需要在不夸大功能的前提下，将结构调整为更接近常见开源项目展示页的阅读顺序与分区。

## What Changes

- 重组 `README.md` 区块顺序与标题层级：简介、亮点、截图/状态说明（如实描述当前无内置截图时可说明）、使用流程、快速开始、目录导航（TOC）、技术栈与开发说明等。
- 修正相对链接：GitHub Releases 应使用仓库内有效路径或绝对说明，避免 `../../releases` 这类在默认视图下易失效的链接。
- 更新 `readme-documentation` 规格：补充对展示型结构与导航的验收要求。

## Capabilities

### New Capabilities

（无；仅扩展现有 README 文档规格。）

### Modified Capabilities

- `readme-documentation`: 增加对 GitHub 风格分区、目录导航与链接有效性的要求。

## Impact

- 仅影响仓库根目录 `README.md` 与 `openspec/specs/readme-documentation/spec.md`（经 delta 同步）。
