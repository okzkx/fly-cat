## Context

用户明确要求只通过 `openspec-all-in-one` skill 来完成 archive 后中文报告输出，不要再修改 OpenSpec 源码、脚本或额外工作流文件。当前工作区里已经有 `openspec-all-in-one` skill 的未提交改动，因此本次 change 的实现重点是把这些改动纳入一个最小 OpenSpec 流程，并在 archive 后手工写出测试用的中文报告。

## Goals / Non-Goals

**Goals:**
- 只修改 `openspec-all-in-one` skill 文件
- 在 skill 中明确 archive 后中文报告的输出位置和最低内容要求
- 用这次小 change 实际产出一份 `change-report.zh-CN.md`，验证流程可执行

**Non-Goals:**
- 不新增脚本、测试或 CLI 包装层
- 不修改 `openspec-archive-change`、README 或其他 skill/command
- 不尝试让 OpenSpec CLI 原生支持中文报告

## Decisions

### 1. 仅修改 skill，不修改实现层

这次将报告输出定义为 `openspec-all-in-one` skill 的执行要求，而不是仓库自动化能力。这样可以严格满足“只改 skill”的约束，并用一次真实 archive 进行验证。

### 2. 报告文件固定写入归档目录

报告固定写到 `openspec/changes/archive/YYYY-MM-DD-<change>/change-report.zh-CN.md`，这样和归档产物天然放在一起，便于回顾。

### 3. 报告内容最小但完整

报告至少包含基本信息、变更动机、变更范围、spec 影响、任务完成情况；如果归档目录没有 `design.md`，则允许省略设计小节，不阻塞归档。

## Risks / Trade-offs

- [只靠 skill 约束，不能自动强制执行] -> 通过本次小 change 完整跑一遍 archive + report，验证操作可行
- [不同 skill 副本可能漂移] -> 同步更新 `.cursor` 与 `.claude` 两份 `openspec-all-in-one` skill

## Migration Plan

1. 完成 proposal/design/spec/tasks
2. 将当前 skill 改动视为本次实现内容
3. 校验并 archive 本 change
4. 在归档目录手工生成中文报告
5. 提交与本次 change 相关文件

## Open Questions

- 暂无。本次仅做最小验证提交。
