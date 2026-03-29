---
name: opencat-run-task
description: OpenCat 任务列表连续执行器。按 TODO.md 中的优先级顺序执行任务，通过 SubAgent + opencat-work 逐个执行、验收、归档，全程无需人工干预。Use when the user wants to run through a TODO.md task list automatically.
license: MIT
compatibility: Requires opencat-work skill to be available in the project.
metadata:
  author: opencat
  version: "1.2"
  derivedFrom: "dev-task-runner"
---

# /opencat-run-task - 任务列表连续执行器

执行 `TODO.md` 中的任务，按优先级 P1 > P2 > P3 顺序，通过 SubAgent 调用 `opencat-work` 逐个完成。

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
   - 启动 SubAgent（`general-purpose` 类型）
   - SubAgent 内部调用 `/opencat-work` 完成任务
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
2. **必须使用 opencat-work**: SubAgent 内部通过 `/opencat-work` 完成任务
3. **立即保存**: 每次编辑文件后立即保存，不要批量操作
4. **任务描述清晰**: 任务应当具体可执行、可验收
5. **不修改任务内容**: 除非用户明确要求

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
