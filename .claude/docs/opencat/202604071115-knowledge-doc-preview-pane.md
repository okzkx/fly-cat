# OpenCat 归档报告：knowledge-doc-preview-pane

## 基本信息

- **变更名称：** `knowledge-doc-preview-pane`
- **归档日期：** 2026-04-07
- **基础分支：** `master`
- **任务分支：** `opencat/knowledge-doc-preview-pane`（合并后已删除）
- **OpenSpec 归档路径：** `openspec/changes/archive/2026-04-07-knowledge-doc-preview-pane/`

## 执行者身份

- **展示名 / Git user.name：** 览页猫
- **Git user.email：** lanYeMao@opencat.dev
- **摘要：** 览页猫（预览构筑师·布偶猫）
- **风格：** 安静细致，重视阅读流与界面秩序；口头禅：「页面铺好，眼睛才舒服」

## 变更动机

用户在知识库树中选中已同步文档时，希望在不离开应用、不重跑同步管线的前提下，直接阅读本地 Markdown 同步结果；浏览器模拟运行时需明确降级，避免误认能读磁盘。

## 变更范围

- **Tauri：** 新增 `read_synced_markdown_preview`（manifest → 读 UTF-8 文本），`SyncedMarkdownPreview` 模型，`lib.rs` 注册。
- **前端：** `HomePage` 左右分栏；新建 `MarkdownPreviewPane`（`marked` + `DOMPurify` + Tauri `convertFileSrc` 改写相对图片）；`markdownPreview.ts` 路径解析工具；`styles.css` 预览区排版。
- **依赖：** `marked`、`dompurify`、`@types/dompurify`。
- **测试：** `tests/markdown-preview-utils.test.ts`（路径解析）。
- **规格：** 新增主规格 `openspec/specs/knowledge-doc-markdown-preview/spec.md`（由归档流程从 delta 合并）。

## 规格影响

- 新增能力 **knowledge-doc-markdown-preview**：只读预览区、浏览器降级、相对图片解析、后端只读命令。

## 任务完成情况

- Purpose / propose：已完成并通过 `openspec validate`。
- Apply：已实现并通过 `npm run typecheck`、`cargo check`、`npm run build`、`vitest` 指定用例。
- Archive：已执行 `openspec archive -y`，变更目录已移至 `openspec/changes/archive/2026-04-07-knowledge-doc-preview-pane/`。
- Merge：已合并回 `master`（见提交历史），任务分支已删除。

## 验证摘要

| 检查项 | 结果 |
|--------|------|
| `openspec validate knowledge-doc-preview-pane`（归档前） | 通过 |
| `npm run typecheck` | 通过 |
| `cargo check`（src-tauri） | 通过 |
| `npm run build` | 通过 |
| `vitest run tests/markdown-preview-utils.test.ts` | 通过 |

## 已知限制 / 剩余问题

- 预览按 UTF-8 读取；非 UTF-8 本地文件可能出现乱码（设计文档已列为非目标）。
- 选中树节点仍会触发既有的三态勾选逻辑；预览与勾选联动未解耦（沿用现有 `onSelect` 行为）。
- 多维表格（bitable）不在此区域做 Markdown 预览，仅提示用户查看同步目录。
