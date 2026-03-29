## Why

用户同步完文档后再次打开知识库目录，无法直观看到哪些文档已经同步过，也无法方便地移除不再需要的已同步文档。当前的打勾状态仅反映用户本次会话的选中意图，与文档的实际同步状态脱节，导致用户在重复同步时需要手动重新选择所有已同步的文档。

## What Changes

- 已同步完成的文档在知识库目录树中默认显示为打勾（checked）状态
- 用户可以取消打勾已同步的文档，表示"不再需要保留此文档"
- 点击"开始同步"时，系统自动清理所有未打勾但实际已同步到磁盘的文档（包括删除文件和清除 manifest 记录）
- 等待同步（pending）或正在同步（syncing）中的文档不允许进行打勾或取消打勾操作（checkbox 被禁用）

## Capabilities

### New Capabilities

- `synced-doc-checkbox`: 已同步文档在知识库树中的默认打勾状态管理，以及取消打勾后的自动清理逻辑

### Modified Capabilities

- `knowledge-base-source-sync`: 同步任务创建流程需在启动同步前先清理未勾选的已同步文档

## Impact

- 前端 `HomePage.tsx`: 树组件的 checkedKeys 计算逻辑需合并已同步文档的默认勾选；onCheck 需过滤正在同步的文档
- 前端 `App.tsx`: onCreateTask 流程需在创建同步任务前调用 removeSyncedDocuments 清理未勾选的已同步文档
- 前端 `tauriRuntime.ts`: removeSyncedDocuments 已存在，无需修改
- Rust 后端 `commands.rs`: remove_synced_documents 已存在，无需修改
- 类型定义 `types/app.ts`: HomePageProps 的 onToggleSource 签名可能需要调整以支持禁用场景
