---
name: opencat-work
description: OpenCat 任务列表连续执行器。按 TODO.md 中的优先级顺序执行任务，通过 SubAgent + opencat-task 技能逐个执行、验收、归档，全程无需人工干预。Use when the user wants to run through a TODO.md task list automatically.
license: MIT
compatibility: Requires opencat-task skill to be available in the project.
metadata:
  author: opencat
  version: "1.2"
  derivedFrom: "dev-task-runner"
---

# /opencat-run-task - 任务列表连续执行器

执行 `TODO.md` 中的任务，按优先级 P1 > P2 > P3 顺序，通过 SubAgent 调用 `opencat-task` 技能逐个完成。

当用户明确调用 `opencat-work` 或 `/opencat-run-task` 时，默认启用 AI 自主决策：
- 若用户未指定具体任务，优先从当前上下文和 `TODO.md` 中自动选择最合理的任务继续执行
- 不因常规任务选择而停下来等待确认
- 仅当多个候选任务会显著改变范围、行为或风险，且无法安全自主判断时，才暂停询问

## 文件格式

### TODO.md

```markdown
# TODO

## P1 >
- 任务A
- 任务B

## P2
- 任务C
- 任务D

## P3
- 任务E
- 任务F
```

### DONE.md

```markdown
# DONE

## P1
- [2026-03-29 14:30] 实现用户登录功能 — 完成页面和接口对接，登录跳转正常

## P2
- [2026-03-29 15:10] 编写登录模块单元测试 — 所有测试通过

## P3
- [2026-03-29 16:00] 部署到测试环境
```

## 解析规则

- **优先级**: P1 > P2 > P3
- **活跃章节**: 带 `>` 标记的章节（`## P1 >`），表示用户关注的焦点章节，**不自动标记**
- **活跃任务**: 带 `>` 标记的任务（`- > 任务A`），表示正在执行的任务，**执行前自动标记**
- **任务格式**: `- 任务名称`（不使用数字序号）

## 执行流程

1. **初始化**
   - 读取 `TODO.md` 和 `DONE.md`
   - 扫描所有章节，识别活跃章节和活跃任务

2. **状态判断**

   | 条件 | 操作 |
   |------|------|
   | 所有章节为空 | **直接结束**，报告"无任务" |
   | 有活跃任务 | 执行该活跃任务 |
   | 无活跃任务 但 有未完成任务 | 自动标记第一个任务为活跃：`- > 任务A`，然后执行 |

   **任务选择优先级**（无活跃任务时）：
   1. 活跃章节中的第一个任务
   2. 若活跃章节为空，按 P1 > P2 > P3 顺序取第一个有任务的章节的第一个任务

3. **执行任务**
   - 主 Agent 只负责选择任务、启动/衔接 SubAgent、更新任务记录与汇总结果，不提前实现、调试或接管子任务细节
   - 启动 SubAgent（`general-purpose` 类型）
   - **重要** **SubAgent** 内部必须调用 **`/opencat-task` 技能** 完成任务
   - **必须使用 worktree 隔离**：SubAgent 必须按照 opencat-task 的完整流程执行
     - purpose 阶段在主 worktree
     - apply/archive 阶段在独立的 git worktree 中
     - 变更必须合并回主干
     - worktree 保留不删除
     - 遇到主干推进、分支分叉或合并冲突时，永远先 rebase 到最新提交，再自行解决冲突，不因冲突而停下来等待确认
   - SubAgent 完成后自动销毁，上下文完全隔离

4. **归档**
   - 从 `TODO.md` 删除已完成任务行
   - 在 `DONE.md` 对应章节追加记录：`- [时间] 任务名称 — 执行结果`
   - 提交 git：`git add TODO.md DONE.md && git commit -m "完成: 任务名称"`

5. **继续下一个**
   - 活跃章节还有任务 → 标记第一个为活跃任务
   - 活跃章节为空 → 按优先级取下一章节的第一个任务，标记为活跃
   - 所有章节为空 → 报告"全部完成"

6. **失败处理**
   - 在任务行后追加注释：`- 任务名称 <!-- 失败: 原因 -->`
   - 等待人工修复后重新运行

## 核心规则

1. **SubAgent 独立执行**: 每个任务由全新 SubAgent 执行，上下文 100% 隔离
2. **必须使用 opencat-task**: SubAgent 内部通过 `/opencat-task` 技能完成任务
3. **主 Agent 不抢子 Agent 工作**: 主 Agent 必须保持上下文窗口干净简洁，只做编排、状态管理和最终汇总，不直接展开实现、调试、测试、读大量业务代码等本应由 SubAgent 完成的工作
4. **必须使用 worktree**: opencat-task 的 apply/archive 阶段必须在独立 worktree 中执行
5. **变更合并回主干**: 完成后必须将变更合并回 base_branch
6. **worktree 保留不删除**: 任务完成后保留 worktree 目录供下次使用
7. **冲突处理固定策略**: 遇到分支冲突、主干推进、rebase 冲突或 merge 冲突时，永远先 rebase 到最新提交，再自行解决冲突并继续流程
8. **立即保存**: 每次编辑文件后立即保存，不要批量操作
9. **任务描述清晰**: 任务应当具体可执行、可验收
10. **不修改任务内容**: 除非用户明确要求
11. **默认自主选择任务**: 显式调用本技能但未指定任务时，按上下文和优先级自主决定并继续

## 输出格式

```text
## OpenCat Run Task

**当前任务:** <任务名称>
**优先级:** P1|P2|P3
**状态:** 执行中|完成|失败

<进度说明>
```

## 注意事项

- `TODO.md` + `DONE.md` 是权威来源
- 支持断点恢复（从中断处继续）
- 支持 `/clear` 后继续，状态保存在文件中
- 失败任务等待人工修复后继续
- 文件格式保持简洁
- 遇到冲突时不暂停询问，默认 rebase 到最新提交并自行解决冲突
