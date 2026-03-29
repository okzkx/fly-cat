## Context

知识库同步树 (`HomePage.tsx`) 使用 Ant Design `Tree` 组件的 `checkable` + `checkStrictly` 模式。当前 `checkedKeys` 仅包含用户通过 `onToggleSource` 主动选择的同步源 (`selectedSources`)。系统已具备以下基础设施：
- `documentSyncStatuses`: 从后端获取的每文档同步状态（synced/failed）
- `removeSyncedDocuments`: Rust 后端命令，可按 documentId 列表删除已同步文件和 manifest 记录
- `syncingKeys`: 已实现的同步中文档 checkbox 禁用逻辑

## Goals / Non-Goals

**Goals:**
- 已同步文档在树中默认显示为打勾状态
- 用户可以取消打勾已同步文档
- 点击"开始同步"时自动清理未勾选的已同步文档
- 同步中/等待中的文档禁止打勾/取消打勾

**Non-Goals:**
- 不修改后端 Rust 代码（已有 `remove_synced_documents` 命令）
- 不修改 manifest 数据结构
- 不处理"部分同步成功"状态的文档的特殊逻辑

## Decisions

### 1. 默认打勾策略：合并已同步文档 key 与用户选中 key
**选择**: 将 `syncedDocumentIds` 对应的树节点 key 合并到 `checkedKeys` 中，而非替换。
**理由**: 用户可能同时选中未同步的文档和已同步的文档，两者应同时显示为打勾。已同步文档的打勾代表"保留"，用户选中未同步文档代表"本次要同步"。
**替代方案**: 仅用已同步状态替代用户选择 -- 这会丢失用户对未同步文档的选中意图。

### 2. 取消打勾的语义：标记为待删除
**选择**: 取消打勾一个已同步文档时，仅从 `selectedSources` 中移除（如果存在）并在 `allCheckedKeys` 中排除该 key。
**理由**: 已同步文档的 key 来源于 `syncedDocumentIds`（自动合并），而非 `selectedSources`。因此需要一个独立的集合来追踪"用户主动取消打勾的已同步文档"。
**替代方案**: 将取消打勾的已同步文档加入 `selectedSources` -- 语义混乱。

### 3. 清理时机：在 onCreateTask 时同步清理
**选择**: 在 `onCreateTask` 回调中，创建同步任务之前，先计算未勾选的已同步文档列表，调用 `removeSyncedDocuments` 清理。
**理由**: 用户点击"开始同步"是最自然的清理时机，符合用户预期。异步清理完成后才创建任务。
**替代方案**: 独立的"清理"按钮 -- 增加额外的 UI 步骤，用户可能忘记清理。

### 4. 同步中/等待中文档的 checkbox 禁用
**选择**: 复用现有的 `syncingKeys` 和 `disableCheckbox` 机制，在 `buildTreeNodes` 中已有此逻辑。
**理由**: 当前代码已通过 `syncingKeys` 集合和 `disableCheckbox` 属性实现了对同步中文档的禁用，无需额外改动。

## Risks / Trade-offs

- **误删风险**: 用户取消打勾后可能不知道文档会被删除 -> 缓解：清理时使用 Modal.confirm 确认对话框
- **性能**: 清理操作需要调用后端删除文件 -> 缓解：`removeSyncedDocuments` 已是单个批量命令
- **状态一致性**: 清理后需要刷新 `documentSyncStatuses` -> 缓解：清理完成后重新获取状态
