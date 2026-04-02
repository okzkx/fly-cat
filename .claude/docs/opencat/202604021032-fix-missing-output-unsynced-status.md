# 变更报告：本地输出缺失时同步状态回退未同步

## 基本信息

- **变更名称**: fix-missing-output-unsynced-status
- **归档日期**: 2026-04-02
- **基础分支**: master

## 执行者身份

- **姓名**: 回环猫
- **品种**: 暹罗猫
- **职业**: 界面魔法师
- **经历**: 回环猫擅长给复杂列表补齐细粒度状态反馈，遇到“按钮已做了事，但列表还像没变”这类错位感尤其敏感。
- **性格**: 机敏专注，偏爱小而准的交互设计
- **口头禅**: 轻点一下，流程再转一圈
- **邮箱**: huihuanmao@opencat.dev

## 变更动机

知识库树当前把 manifest 中的历史 `success` 记录直接映射为 `已同步`，没有核对该记录指向的本地输出文件是否还存在。这样一来，用户执行 **强制更新** 或其他本地清理后，在下一次同步真正写回文件之前，树上仍会误显示 `已同步`，和实际磁盘状态脱节。

## 变更范围

- `src-tauri/src/commands.rs`：新增 `manifest_record_has_local_output(...)`；`get_document_sync_statuses(...)` 仅在成功记录的 `output_path` 仍存在本地文件时才返回 `synced`；补充缺文件状态回退的回归测试。
- `openspec/specs/knowledge-tree-display/spec.md`：归档 delta 后补充“本地输出缺失时必须回退为未同步”的要求与场景。
- OpenSpec 变更将归档到 `openspec/changes/archive/2026-04-02-fix-missing-output-unsynced-status/`。

## 规格影响

- `knowledge-tree-display`：知识库树的同步标签必须以“manifest 成功记录 + 本地输出文件仍存在”为准；若本地文件已被删除，则叶子与聚合状态都不再把该文档计为已同步。

## 任务完成情况

- Purpose / Apply / Archive 流程已完成。
- 验证：`cargo test --manifest-path "src-tauri/Cargo.toml"`（81 项通过）。
- 验证：`openspec validate --changes "fix-missing-output-unsynced-status"`（归档前通过）。

## 残余风险

- 当前回退判断依赖 `output_path` 为实际文件；若未来某类同步输出改为目录型产物，需要同步调整这层存在性判定。
