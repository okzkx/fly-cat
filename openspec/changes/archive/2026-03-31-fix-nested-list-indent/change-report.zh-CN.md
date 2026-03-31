# 变更报告：fix-nested-list-indent

## 基本信息

- **变更名称**: fix-nested-list-indent
- **归档日期**: 2026-03-31
- **基础分支**: master

## 变更动机

飞书块树中嵌套的有序/无序列表在展平与合并后丢失层级，同步出的 Markdown 中二级与一级列表左对齐，编号连续，不符合阅读预期。

## 变更范围

- `src-tauri/src/model.rs`：新增 `ListItem { indent, text }`，列表块使用 `Vec<ListItem>`。
- `src-tauri/src/mcp.rs`：`flatten_block_tree` 传递列表深度；列表项解析写入 `indent`；新增嵌套有序列表展平测试。
- `src-tauri/src/render.rs`：有序列表按深度独立计数并缩进（每级 4 空格）；无序列表按深度缩进。
- `openspec/specs/mcp-markdown-content-pipeline/spec.md`：合并 delta 需求与场景。

## 规格影响

在「Canonical Markdown Generation」下增加嵌套列表缩进与多级有序编号重启的场景描述。

## 任务完成情况

- 实现与单元测试已完成；`cargo test` 全部通过。

## 验证

- `openspec validate fix-nested-list-indent --type change`（归档前）
- `cargo test`（`src-tauri`，66 tests）

---

🐱 缩进猫（文档锻造师·沙特尔猫）
