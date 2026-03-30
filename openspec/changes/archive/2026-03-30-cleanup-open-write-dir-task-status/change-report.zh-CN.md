# 变更报告: cleanup-open-write-dir-task-status

## 基本信息

| 项目 | 内容 |
|------|------|
| 变更名称 | `cleanup-open-write-dir-task-status` |
| 归档日期 | `2026-03-30` |
| Schema | `spec-driven` |
| 归档路径 | `openspec/changes/archive/2026-03-30-cleanup-open-write-dir-task-status` |

## 变更动机

`TODO.md` 仍把“打开实际写入目录报错”标记为当前活跃 P2 任务，但仓库当前实现、已归档的 `fix-opener-permission` 变更，以及 `DONE.md` 中的既有记录都表明该问题已经完成修复。本次工作的目标不是重复修复，而是清理残留的任务队列状态。

## 变更范围

- 核对 `src-tauri/capabilities/default.json` 中已存在 `opener:allow-open-path`
- 依照现有完成记录清理 `TODO.md` 中的残留活跃项
- 将下一个真实 P2 任务切换为当前活跃项
- 新增 `task-queue-hygiene` 工作流规格，记录 cleanup-only 任务的处理原则

## 规格影响

- 新增 `task-queue-hygiene` 主规格
- 归档变更中的 delta spec 说明：已验证完成记录存在时，应清理 `TODO.md` 而不是重复追加 `DONE.md`

## 任务完成情况

| 任务 | 状态 |
|------|------|
| 确认目录打开报错已由既有 opener 权限修复完成 | 完成 |
| 清理 `TODO.md` 中残留的活跃任务状态并切换到下一个 P2 任务 | 完成 |
| 补充 cleanup-only 队列维护的 OpenSpec 规格 | 完成 |
| 验证变更并准备归档 | 完成 |

## 总结

本次 change 判定为“清理残留状态”而不是“真实修复”。它没有重新实现目录打开能力，而是让任务队列与现有代码和完成记录重新保持一致，避免同一修复继续滞留在活跃 TODO 顶部。
