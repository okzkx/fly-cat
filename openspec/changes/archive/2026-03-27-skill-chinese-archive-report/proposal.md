## Why

当前仓库只需要在 `openspec-all-in-one` skill 流程里约定“archive 完成后输出中文报告”，并不需要额外修改 OpenSpec CLI、脚本或其他流程文件。需要用一个最小变更把这件事落地，并顺便完成一次实际归档来验证中文报告输出。

## What Changes

- 仅更新 `openspec-all-in-one` skill，使其在 archive 成功后要求生成归档目录内的中文报告。
- 保持报告来源为归档目录中已有的 `proposal.md`、`design.md`、`specs/**/*.md`、`tasks.md`，不引入新的脚本或自动化实现。
- 使用一个小型 OpenSpec change 完整跑通 `proposal -> apply -> archive -> commit`，验证中文报告可以按 skill 流程落到归档目录中。

## Capabilities

### New Capabilities

- `skill-driven-archive-reporting`: 通过 `openspec-all-in-one` skill 流程在 archive 后生成中文变更报告

### Modified Capabilities

无

## Impact

- 受影响文件：`.cursor/skills/openspec-all-in-one/SKILL.md`、`.claude/skills/openspec-all-in-one/SKILL.md`
- 受影响归档产物：`openspec/changes/archive/YYYY-MM-DD-<change>/change-report.zh-CN.md`
- 不修改 OpenSpec CLI、仓库脚本或其他工作流文件
