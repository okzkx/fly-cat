# 归档变更报告

## 基本信息

- 变更名称：`skill-chinese-archive-report`
- 归档目录：`openspec/changes/archive/2026-03-27-skill-chinese-archive-report`
- Schema：`spec-driven`
- 报告文件：`change-report.zh-CN.md`

## 变更动机

本次变更的目标是用一个最小提交验证：只通过 `openspec-all-in-one` skill 的约束，也能在 change 完成 archive 后产出中文变更报告，而不需要再修改 OpenSpec CLI、脚本或其他流程文件。

## 变更范围

- 仅更新 `openspec-all-in-one` skill
- 明确 archive 成功后要在归档目录输出 `change-report.zh-CN.md`
- 约定报告至少包含基本信息、变更动机、变更范围、spec 影响和任务完成情况
- 不新增脚本、测试、README 说明或其他 OpenSpec 工作流文件

## 规格影响

- 新增 capability：`skill-driven-archive-reporting`
- 对应 delta spec：`specs/skill-driven-archive-reporting/spec.md`
- 该 capability 说明 `openspec-all-in-one` 可以在 skill 驱动流程中，于 archive 后输出中文 Markdown 报告

## 任务完成情况

- 已完成：5/5

### 已完成任务

- 1.1 Keep the `openspec-all-in-one` skill scoped to skill-level Chinese archive report output only
- 1.2 Ensure both `.cursor` and `.claude` copies describe the archive report path and minimum report sections
- 2.1 Validate the change artifacts and confirm the skill-only implementation is sufficient
- 2.2 Archive this small change and generate `change-report.zh-CN.md` in the archived directory as the workflow test
- 2.3 Commit the small change and archived report output

## 设计摘要

- 只通过 skill 约束来定义中文报告输出，不将其实现为仓库自动化能力
- 报告固定写入归档目录，便于和 proposal、design、specs、tasks 一起回顾
- 如果未来需要更强的自动化，再考虑脚本或包装层实现；本次提交只做最小验证
