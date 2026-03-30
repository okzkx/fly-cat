---
name: opencat-cleanup
description: 清理 `opencat-task` 执行后的残留状态：识别未合并提交、已合并分支残留和未回到 `master` 的保留 worktree。Use when the repository contains retained OpenCat worktrees, leftover `opencat/*` branches, unfinished task flows, or when a worktree should be restored to `master` for reuse.
license: MIT
compatibility: Requires a git repository that uses the OpenCat worktree workflow from `opencat-task`.
metadata:
  author: opencat
  version: "1.0"
  derivedFrom: "opencat-task"
---

# OpenCat Cleanup

清理 `opencat-task` 执行后的残留，目标是：

- 未合并的任务继续执行，而不是半途废弃
- 已合并的工作分支残留被清掉
- 保留的 worktree 最终回到 `master`，供下一次任务复用

---

## 适用场景

当出现以下任一情况时使用本技能：

- 仓库里存在 `opencat/*` 工作分支或保留 worktree
- 某个 worktree 还停在功能分支上，没有切回 `master`
- 看起来有一次 `opencat-task` 执行到一半中断了
- 需要在开始新任务前先把旧的 OpenCat 残留状态收尾

---

## 输入

- 当前仓库根目录
- 可选：用户指定要清理的 worktree 路径或分支名

若用户未指定，自动扫描整个仓库的 OpenCat 残留。

---

## 核心原则

1. **优先续做，不丢任务**
   - 只要发现某个 OpenCat 工作分支上还有**未合并到 `master`** 的提交，就不要直接删除，必须优先使用 `\opencat-task` 继续执行该次任务，直到其合并或明确失败。

2. **已合并后只清残留，不改主干历史**
   - 若工作分支上的提交已经合并进 `master`，清理的是**分支引用和 worktree 状态**，不是重写 `master` 历史。
   - 不做 `reset --hard`、`rebase -i`、`push --force` 之类的破坏性历史改写，除非用户明确要求。

3. **worktree 保留，但要回到主干待命**
   - 清理完成后，保留的 worktree 目录应切回 `master`，并保持工作区干净。

4. **一次只收尾一个未竟流程**
   - 如果扫描到多个未合并分支，按风险最高、最像“中断中的旧任务”的那个先处理；不要一边继续一个未竟任务，一边领取新任务。

5. **开发前与合并前都先 rebase**
   - 无论是继续旧任务，还是准备 merge 回 `master`，都先把工作分支 rebase 到最新 `master`。
   - 若 rebase 或 merge 产生冲突，AI 默认自行解决并继续，不因常规冲突暂停。

---

## 扫描步骤

1. 确认当前基础分支
   - 默认使用 `master`
   - 若仓库实际主干不是 `master`，先识别真实 trunk，再按真实 trunk 执行；但本仓库默认目标应恢复到 `master`

2. 收集仓库状态
   - 检查 `git status --short`
   - 检查 `git branch --all`
   - 检查 `git worktree list --porcelain`

3. 识别候选残留
   - 分支名匹配 `opencat/*`
   - 保留 worktree 当前不在 `master`
   - worktree 对应分支存在未被清理的 OpenCat 提交

4. 对每个候选分支判断：
   - 是否有仅存在于该分支、尚未进入 `master` 的提交
   - 是否已经完整合并到 `master`
   - worktree 是否干净

---

## 判断规则

### 情况 A：存在未合并提交

满足任一条件即可视为“未合并提交仍需继续”：

- `master.. <work-branch>` 仍然有提交
- worktree 仍停留在 `opencat/*` 分支，且该分支不是纯空分支
- 该分支明显对应一次中断的 `opencat-task` 流程

处理方式：

1. 不删除该分支
2. 不强行切回 `master`
3. 调用 `\opencat-task`，继续执行该次任务
4. 目标是让它完成：
   - apply / archive / merge / cleanup 的剩余步骤
   - 或明确失败并保留可解释状态

继续该任务时，也要遵守固定顺序：

1. 开始继续开发前，先 rebase 到最新 `master`
2. 完成开发后，准备 merge 前再次 rebase 到最新 `master`
3. rebase / merge 冲突由 AI 自行解决并继续

### 情况 B：提交已经合并到 `master`

满足以下任一条件即可视为“已经合并，可清理残留”：

- `git merge-base --is-ancestor <work-branch> master` 为真
- 或该分支相对 `master` 没有独有提交

处理方式：

1. 确认 worktree 没有未提交改动
2. 将该 worktree 切回 `master`
3. 删除对应 `opencat/*` 分支
4. 保留 worktree 目录，不删除目录

说明：

- 这里“删除这个提交”指删除它在残留工作分支上的独立承载关系，让该分支不再占用仓库状态
- 已经进入 `master` 的提交会自然保留在主干历史中，不应再去重写或抹除

### 情况 C：worktree 不在 `master`

若 worktree 当前不在 `master`：

- 先按情况 A / B 判断其当前分支
- 若该分支未合并：继续 `\opencat-task`
- 若该分支已合并：删除残留分支，并把 worktree 切回 `master`

最终要求：

- worktree 保留
- 当前分支为 `master`
- 工作区干净

---

## 推荐执行顺序

1. 扫描所有 worktree 与 `opencat/*` 分支
2. 找出不在 `master` 的 worktree
3. 对其当前分支判断是否已合并
4. 若未合并，立即转为“继续任务”模式，调用 `\opencat-task`
5. 若已合并，执行清理：
   - 切回 `master`
   - 删除残留分支
6. 复查所有保留 worktree，确保都回到 `master`

---

## 与 `\opencat-task` 的衔接方式

当判定为“未合并提交”时，不要自己发明一个简化流程去硬收尾，而是：

1. 识别该分支对应的 change name、任务名或最近一次 OpenCat 提交语义
2. 将这些上下文交给 `\opencat-task`
3. 明确目标是“继续上一次中断的任务”，不是创建一个新任务
4. 等待 `\opencat-task` 完成标准流程：
   - 开发前先 rebase 到最新 `master`
   - 必要的 apply / archive
   - merge 前再次 rebase 到最新 `master`
   - 合并回 `master`
   - 删除工作分支
   - worktree 切回 `master`

若无法可靠识别对应任务，才暂停并向用户确认，不要贸然删除。

---

## 清理完成标准

对每个保留 worktree，都应满足：

- 在 `master` 分支上
- `git status --short` 为空
- 不再绑定已完成的 `opencat/*` 残留分支

对整个仓库，应尽量满足：

- 不存在已合并但未删除的 `opencat/*` 分支
- 不存在“明明已完成却仍停在功能分支”的保留 worktree
- 不存在被误删的未合并任务

---

## 暂停条件

遇到以下情况暂停并询问用户：

- worktree 中有未提交改动，且无法确认是否属于当前 OpenCat 任务
- 无法判断某个分支是否已合并
- 分支上的提交看起来不是 OpenCat 任务产物
- `master` 不是实际主干，且仓库策略不明确
- 删除分支可能影响用户当前正在使用的上下文

---

## 输出格式

### 执行中

```text
## OpenCat Cleanup

**Base:** master
**Target Worktree:** <path>
**Current Branch:** <branch>
**Decision:** continue-task | cleanup-merged | switch-to-master

<进度说明>
```

### 完成后

- 扫描到的 worktree / 分支数量
- 继续执行的未合并任务
- 已清理的已合并分支
- 已恢复到 `master` 的 worktree
- 仍需人工确认的问题（如有）

---

## 护栏规则

| 规则 | 说明 |
|------|------|
| 未合并先续做 | 有未合并提交时，必须继续 `\opencat-task`，不能直接删 |
| 已合并再清理 | 仅当确认已合并进 `master` 后，才删除残留分支 |
| 开发前和合并前先 rebase | 工作分支开始开发前、merge 回 `master` 前，都先 rebase 到最新 `master` |
| 冲突自解 | rebase / merge 冲突默认由 AI 自行解决并继续 |
| 不删 worktree 目录 | 清理的是分支和状态，不是 worktree 目录 |
| 不重写主干历史 | 不删除 `master` 上已存在的提交 |
| 最终回到 master | 保留 worktree 最终都应回到 `master` |

---

## 成功 / 失败条件

### 成功

- ✅ 未合并的 OpenCat 提交没有被误删，而是转交 `\opencat-task` 继续执行
- ✅ 已合并的 `opencat/*` 残留分支被删除
- ✅ 保留 worktree 没有删除，且都回到 `master`
- ✅ 仓库处于更适合下次任务复用的状态

### 失败

- ❌ 将未合并分支误判为已合并并删除
- ❌ 为了“删提交”而改写 `master` 历史
- ❌ 清理后 worktree 仍停留在功能分支
- ❌ 删除了本应保留复用的 worktree 目录

---

## Windows PowerShell 注意事项

- 使用 PowerShell 兼容命令，不依赖 bash heredoc
- 逐步执行 git 检查与清理，不把高风险命令串成不可中断的大命令
- 删除分支前先再次确认当前 worktree 已切回 `master` 且工作区干净
