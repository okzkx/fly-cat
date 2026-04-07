# avoid-discovery-document-info-burst — 归档报告

## 基本信息

- **变更名称**: `avoid-discovery-document-info-burst`
- **归档目录**: `openspec/changes/archive/2026-04-07-avoid-discovery-document-info-burst/`
- **日期**: 2026-04-07

## 执行者

- **展示名 / Git user.name**: 扫帚猫
- **Git user.email**: saozhoumao@opencat.dev

## 变更动机

大范围勾选知识库后启动同步时，discovery 虽然按递归顺序逐个遍历节点，但仍会为绝大多数文档额外调用一次 `docx` 文档详情接口。文档一多时，这些连续详情请求会明显放大 Feishu `99991400` 限频概率，导致任务卡在“本次失败主要发生在发现阶段（1项）”。

## 变更范围

- `src-tauri/src/commands.rs`：在 discovery 建队列时优先复用 `FeishuWikiNode` 上已有的 `title`、`version`、`update_time` 元数据，只有字段不完整时才回退到现有的 `fetch_document_summary_with_retry()`。
- `src-tauri/src/commands.rs`：补充后端单测，覆盖“wiki 节点元数据足够直接入队”和“元数据不完整时需要回退 summary”两个判断分支。
- `openspec/specs/knowledge-base-source-sync/spec.md`：将 discovery 阶段的要求更新为“优先复用 wiki 节点元数据，必要时再做带限频重试的 summary 回退”。

## 规格影响

- `knowledge-base-source-sync`：Knowledge Base Scoped Discovery 新增对 discovery 建队列元数据来源的约束，明确优先使用 wiki 节点元数据而不是对每个文档都追加一次详情请求。

## 任务完成情况

- [x] 复用 wiki child-node 元数据构建 discovery 队列
- [x] 保留不完整元数据时的 summary 回退与限频重试
- [x] 增加后端回归测试
- [x] `cargo test`
- [x] `openspec validate avoid-discovery-document-info-burst --type change`
- [x] `openspec archive avoid-discovery-document-info-burst -y`

## 验证

- `cargo test`（`src-tauri`）
- `openspec validate avoid-discovery-document-info-burst --type change`
- `openspec archive avoid-discovery-document-info-burst -y`

## 剩余风险

- 用户只同步单个文档根节点时，根文档本身仍沿用现有 summary 获取路径；不过这类场景只会保留单次请求，不再产生大范围 discovery 爆量。
- 若 Feishu 后续在 wiki 节点列表里删除或弱化版本字段，当前实现会自动回退到 summary 路径，但那时 discovery 速率优势会下降。
