## Why

当前 OpenSpec change 在 archive 后只保留 proposal、design、specs 和 tasks 等原始工件，缺少一份面向人阅读的中文变更报告，导致后续回顾时需要逐个打开多个文件才能理解变更背景、范围和完成情况。需要在 archive 完成时自动生成这份中文总结，并支持对历史归档补生成。

## What Changes

- 为已归档 change 增加自动生成中文变更报告的能力，统一输出到归档目录内。
- 为 archive 工作流增加一个包装入口，在执行 `openspec archive` 成功后自动生成中文报告。
- 提供对历史归档目录补生成中文报告的能力，并先为 `2026-03-27-optimize-tauri-port-handling` 生成这份报告。
- 更新 OpenSpec archive 相关命令/skill 文档，使仓库内的归档流程默认使用带报告生成的入口。

## Capabilities

### New Capabilities

- `archive-change-reporting`: 在 change 归档完成后生成归档目录内的中文变更报告，并支持对已有归档补生成

### Modified Capabilities

无

## Impact

- 新增/修改脚本：`scripts/`
- 受影响工作流文档：`.cursor/commands/opsx-archive.md`、OpenSpec archive 相关 skills
- 受影响归档产物：`openspec/changes/archive/<date>-<change>/`
- 可能新增测试以验证报告内容生成逻辑
