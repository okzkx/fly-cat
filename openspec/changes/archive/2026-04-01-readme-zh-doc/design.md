## Context

根目录已有英文 `README.md`，符合 `readme-documentation` 规格。需在零代码改动前提下增加中文对等说明与入口。

## Goals / Non-Goals

**Goals:**

- 新增与 `README.md` 事实一致的中文文档。
- `README.md` 提供稳定、可点击的相对路径链接至该文档。

**Non-Goals:**

- 不翻译或替换 OpenSpec、源码注释等其它英文材料。
- 不引入构建步骤生成中文 README。

## Decisions

- **文件位置与命名**：使用根目录 `README.zh-CN.md`，与常见开源仓库惯例一致，且与 `README.md` 并列便于发现。
- **链接形式**：在英文 README 顶部目录与简短「中文说明」句中使用 `[README.zh-CN.md](./README.zh-CN.md)`。

## Risks / Trade-offs

- 双语文档需与英文版同步维护 → 变更以功能为准，中文与英文同步更新责任在后续 PR 约定中体现。
