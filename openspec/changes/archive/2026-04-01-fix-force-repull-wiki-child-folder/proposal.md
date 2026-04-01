## Why

强制更新仅删除所选文档的 `.md` 文件与清单中的图片路径；知识库/wiki 下「带子文档的文档」在磁盘上通常表现为同级目录 `标题/` 存放子文档。该目录未被删除时，子文档本地文件仍存在且 manifest 版本仍与远端一致，同步流水线会按「未变更」跳过子文档，用户感知为强制刷新后子文档未更新。

## What Changes

- 在 `prepare_force_repulled_documents` 的本地清理阶段，对 Markdown 输出路径：在删除 `.md` 文件后，若存在与文件名（不含扩展名）同名的子目录，则递归删除该目录（wiki 子文档输出树），使后续同步因输出缺失而重新拉取子文档。

## Capabilities

### New Capabilities

### Modified Capabilities

- `knowledge-tree-display`: 补充 **强制更新** 对带子文档的 wiki 文档在磁盘上的清理范围（含同名子目录），保证子文档可被重新拉取。

## Impact

- `src-tauri/src/commands.rs`：`prepare_force_repulled_documents_impl` 与聚焦单测。
