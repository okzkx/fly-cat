---
name: opencat-cleanup
description: 清理 `opencat-task` 残留。**必须**先收尾 OpenSpec active changes、**严禁**误删未合并任务、**必须**让所有保留 worktree 回到闲置分支。开始新任务前或仓库残留时使用。
license: MIT
compatibility: Requires a git repository that uses the OpenCat idle-branch/task-branch worktree workflow from `opencat-task`.
metadata:
  author: opencat
  version: "1.1"
  derivedFrom: "opencat-task"
---

# OpenCat Cleanup

清理 `opencat-task` 执行后的残留，目标是：

## 🚨 核心不可违反规则

1. **必须**先收尾 OpenSpec active changes，再清理 Git 残留；严禁先做表面分支清扫。
2. **严禁**误删未合并任务分支；只要还有未合并提交，就**必须**优先续做该任务。
3. **必须**自动提交未提交改动，再继续判断分支 / worktree 去向。
4. **必须**把所有保留 worktree 恢复到各自的 `idle branch`，严禁让它们停在 `trunk`、detached 或脏状态。
5. **必须**默认自主决断并继续收敛；最多记录问题，不因常规不确定性暂停询问用户。

- OpenSpec 中未归档的 change 先实现并归档
- 未合并的任务继续执行，而不是半途废弃
- 已合并的任务分支残留被删除
- 每个保留 worktree 最终回到自己的 `idle branch`
- 在所有 worktree 都处于闲置态之前，不允许开始执行新的 TODO List

## 调用约定

- `opencat-work` 在开始跑 TODO 队列时，固定先调用一次 `opencat-cleanup`
- `opencat-task` 在完成 merge 回主干后，固定再调用一次 `opencat-cleanup`
- `opencat-cleanup` 是唯一负责工程残留、分支收尾、归还 `idle branch` 的技能
- `opencat-work` / `opencat-task` 不应在各自文档里重复实现完整 cleanup 细节，只保留调用点与结果要求

---

## 适用场景

当出现以下任一情况时使用本技能：

- `openspec/changes/` 下仍有 active change 尚未归档
- 仓库里存在 `opencat/*` 任务分支或保留 worktree
- 某个 worktree 还停在任务分支、`trunk` 或 detached HEAD
- 某个闲置 worktree 上仍有未提交改动
- 看起来有一次 `opencat-task` 执行到一半中断了
- 需要在开始新任务前先把旧的 OpenCat 残留状态收尾

---

## 输入

- 当前仓库根目录
- 可选：用户指定要清理的 worktree 路径或分支名

若用户未指定，自动扫描整个仓库的 OpenCat 残留。

---

## 核心原则

1. **先自动提交，再判断去向**
   - 只要扫描到未提交变更，就先自动提交到当前逻辑分支，再进入后续判断。
   - 自动提交的目标是把 worktree 恢复到“有明确分支承载 + 工作区可继续推进”的状态。
   - 推荐提交信息：`chore(opencat-cleanup): checkpoint <slot-or-branch>`

2. **闲置分支是唯一合法待命状态**
   - 每个保留 worktree slot 都必须有一个一一对应的 `idle branch`，推荐命名为 `opencat/idle/<slot-name>`。
   - worktree 处于闲置状态时，必须在该 `idle branch` 上且工作区干净。

3. **非闲置就视为任务态**
   - 只要某个保留 worktree 不在自己的 `idle branch` 上，它就必须被视为正在执行某个任务。
   - 这意味着 cleanup 不允许把“仍在任务态的 worktree”误当作可领取新任务的空闲槽位。

4. **优先续做，不丢任务**
   - 只要发现某个任务分支上还有**未合并到 `trunk`** 的提交，就不要直接删除，必须优先启动子 Agent 使用 `opencat-task` 继续该任务，直到其合并或明确失败。

5. **已合并后只清残留，不改主干历史**
   - 若任务分支上的提交已经合并进 `trunk`，清理的是分支引用和 worktree 状态，不是重写主干历史。
   - 不做 `reset --hard`、`rebase -i`、`push --force` 之类的破坏性历史改写，除非用户明确要求。

6. **先清 OpenSpec，再清 Git 残留**
   - 在删除分支、切回闲置分支或判定仓库“已清理”之前，必须先检查 OpenSpec 中是否还有 active change 未归档。
   - 只要还有未完成或未归档的 change，就先继续实现并归档，不要先做表面上的 Git 清扫。

---

## 状态定义

对每个保留 worktree slot，都要按以下状态分类：

- `idle-ready`: 在自己的 `idle branch` 上，且 `git status --short` 为空
- `idle-dirty`: 在自己的 `idle branch` 上，但有未提交改动
- `task-active`: 在某个明确的 `opencat/<task-name>` 任务分支上
- `task-dirty`: 在任务分支上，且有未提交改动
- `attached-to-trunk`: 直接停在 `master` / `main`
- `detached`: detached HEAD
- `unknown-branch`: 在一个非闲置、非标准任务命名的分支上

cleanup 的职责就是把所有非 `idle-ready` 状态最终收敛成：

- `task-active` 并继续推进到完成，随后回到 `idle-ready`
- 或直接修复为 `idle-ready`

---

## 扫描步骤

1. 确认当前基础分支
   - 识别真实 `trunk`，通常是 `master` 或 `main`

2. 检查 OpenSpec active changes
   - 运行 `openspec list --json`
   - 对每个 active change 运行 `openspec status --change "<name>" --json`
   - 检查对应 `tasks.md` 是否仍有未完成任务

3. 收集 Git 仓库状态
   - 检查 `git status --short`
   - 检查 `git branch --all`
   - 检查 `git worktree list --porcelain`

4. 为每个保留 worktree slot 推导配对的闲置分支
   - 从 worktree 路径名推导 `slot-name`
   - 按约定得到 `idle_branch = opencat/idle/<slot-name>`
   - 检查该闲置分支是否存在

5. 识别候选残留
   - 分支名匹配 `opencat/*` 且不是 `opencat/idle/*`
   - 保留 worktree 不在自己的 `idle branch`
   - worktree 处于 detached / trunk / dirty 状态
   - worktree 对应任务分支存在未被清理的 OpenCat 提交

6. 对每个候选分支判断
   - 是否有仅存在于该分支、尚未进入 `trunk` 的提交
   - 是否已经完整合并到 `trunk`
   - 是否存在对应 active change
   - worktree 是否干净

---

## 判断规则

### 情况 0：存在未归档的 OpenSpec change

满足以下任一条件即可视为“OpenSpec 尚未收尾完成”：

- `openspec list --json` 仍返回 active changes
- `openspec status --change "<name>" --json` 显示未完成状态
- 该 change 的 `tasks.md` 里仍有 `- [ ]`

处理方式：

1. 优先识别该 change 是否对应某个未完成的任务分支 / 保留 worktree
2. 若对应到未完成的 OpenCat 流程：
   - 启动子 Agent，使用 `opencat-task` 继续该次任务
   - 让它完成 apply、archive、merge 和 return-to-idle
3. 若没有明确对应的 OpenCat 流程：
   - 使用 `openspec-apply-change` 继续实现该 change
   - 任务完成后，使用 `openspec-archive-change` 归档
4. 只要还有 active change 未归档，就不要进入“删除任务分支 / 切回闲置态”的收尾步骤

### 情况 A：worktree 或主仓有未提交变更

满足任一条件即可视为“必须先自动提交”：

- 主 worktree 有未提交变更
- 保留 worktree 处于 `idle-dirty`
- 保留 worktree 处于 `task-dirty`
- detached / unknown worktree 上有未提交改动

处理方式：

1. 若当前已经在明确分支上：
   - 直接把未提交改动自动提交到当前分支
2. 若当前是 detached / trunk / unknown 状态：
   - 先根据 active change、最近一次 OpenCat 提交、分支名语义推断其任务名
   - 尽量先把它附着到对应的任务分支，再自动提交
   - 若仍无法可靠映射，创建一个临时恢复任务分支，例如 `opencat/recover/<slot-name>-<shortsha>`，避免继续留在 detached 状态
3. 自动提交后重新分类：
   - 若变成任务分支且未合并，转入“继续任务”
   - 若只是闲置分支上的轻微残留，转入“恢复闲置态”

### 情况 B：存在未合并任务提交

满足任一条件即可视为“未合并任务仍需继续”：

- `trunk.. <task-branch>` 仍然有提交
- worktree 仍停留在 `opencat/<task-name>` 分支
- worktree 不在 `idle branch`，且能明确对应一次中断的 `opencat-task` 流程

处理方式：

1. 不删除该任务分支
2. 不把该 worktree 强行切回 `idle branch`
3. 优先启动子 Agent，调用 `opencat-task` 继续执行该次任务
4. 目标是让它完成：
   - apply / archive / merge / return-to-idle 的剩余步骤
   - 或明确失败并保留可解释状态

继续该任务时，也要遵守固定顺序：

1. 开始继续开发前，先 rebase 到最新 `trunk`
2. 完成开发后，准备 merge 前再次 rebase 到最新 `trunk`
3. rebase / merge 冲突由 AI 自行解决并继续

### 情况 C：任务分支已经合并到 `trunk`

满足以下任一条件即可视为“已经合并，可清理残留”：

- `git merge-base --is-ancestor <task-branch> <trunk>` 为真
- 或该分支相对 `trunk` 没有独有提交

处理方式：

1. 确认 worktree 没有未提交改动；若有，先执行情况 A 的自动提交
2. 将对应 worktree 切回它的 `idle branch`
3. 让 `idle branch` 对齐最新 `trunk`
4. 删除对应任务分支
5. 保留 worktree 目录，不删除目录

说明：

- 这里“删除任务分支”指删除残留承载关系，让该分支不再占用仓库状态
- 已经进入 `trunk` 的提交会自然保留在主干历史中，不应再去重写或抹除

### 情况 D：worktree 处于 detached / trunk / unknown 状态

若 worktree 当前不在自己的 `idle branch`，且也不在明确的任务分支：

- 先检查是否有未提交改动或未合并提交
- 若有任务痕迹：优先附着到明确任务分支，再按情况 A / B 处理
- 若没有未合并工作且工作区干净：直接切回配对的 `idle branch`

最终不允许保留以下状态：

- detached HEAD
- 直接挂在 `trunk`
- 未解释的未知分支

---

## 推荐执行顺序

1. 先扫描 OpenSpec active changes
2. 收集所有 worktree、任务分支、闲置分支和未提交改动
3. 对所有未提交改动先做自动提交
4. 若存在未归档 change 或未合并任务，优先启动子 Agent 继续这些任务
5. 对已合并任务分支执行清理：
   - 删除任务分支
   - 切回对应 `idle branch`
   - 对齐最新 `trunk`
6. 复查所有保留 worktree，确保都处于 `idle-ready`
7. 只有当所有保留 worktree 都处于闲置态时，才报告仓库已可进入 TODO List 执行

---

## 与 `opencat-task` 的衔接方式

当判定为“存在未归档 OpenSpec change”或“存在未合并任务提交”时，不要自己发明一个简化流程去硬收尾，而是：

1. 先识别 active change 与任务分支 / worktree 的对应关系
2. 若能可靠映射到中断中的 OpenCat 流程，优先交给子 Agent 运行 `opencat-task`
3. 传给子 Agent 的目标必须是“继续上一次中断的任务”，不是创建一个新任务
4. 等待 `opencat-task` 完成标准流程：
   - 开发前先 rebase 到最新 `trunk`
   - 必要的 apply / archive
   - merge 前再次 rebase 到最新 `trunk`
   - 合并回 `trunk`
   - 删除任务分支
   - worktree 切回自己的 `idle branch`

若无法可靠识别对应任务，才允许退回到恢复分支策略；不要贸然删除。

---

## 与 OpenSpec 技能的衔接方式

当 active change 没有明显对应到某个未完成的 OpenCat 任务分支时：

1. 使用 `openspec-apply-change` 按 tasks 顺序继续实现
2. 每完成任务立即更新 `tasks.md`
3. 确认任务全部完成后，再使用 `openspec-archive-change`
4. archive 完成后，确认该 change 已不再出现在 active changes 中
5. 然后再回到本技能，继续处理任务分支 / worktree 清理

若 `openspec-archive-change` 因 incomplete tasks 发出警告，不要绕过实现步骤直接清理 Git 残留。

---

## 清理完成标准

对每个保留 worktree，都应满足：

- 当前分支是它自己的 `idle branch`
- `git status --short` 为空
- 不再绑定任何已完成的任务分支
- 不处于 detached HEAD
- 不直接停在 `trunk`

对整个仓库，应尽量满足：

- `openspec` 中不存在 active 且未归档的 change
- 不存在已合并但未删除的任务分支
- 不存在仍在任务态的保留 worktree
- 不存在被误删的未合并任务
- 现在可以安全进入 `opencat-work` 的 TODO List 执行

---

## 自主决断规则

本技能默认**不暂停、不询问用户、不等待确认**。

当 cleanup 遇到不确定状态时，必须优先选择“保留现场、继续收敛”的方案，而不是停下来提问。默认决策顺序如下：

1. 先保留 worktree 与分支承载关系，不做破坏性清理
2. 先自动提交未提交改动，再判断后续归类
3. 若看起来像未完成任务，优先当作任务继续推进
4. 若看起来已合并，则先切回 `idle branch` 再删任务分支
5. 若无法百分百判断，也先记录风险并选择最保守的继续路径

典型场景的默认决策：

- 无法推断某个 worktree 的 `idle branch`：按约定从 `slot-name` 自动生成并补建
- active change 与 Git 状态映射不清：优先按“仍有未完成任务”处理，交给 `opencat-task`
- 无法确认任务分支是否已合并：优先保留分支，不直接删除，先按未合并继续收尾
- 分支提交不像标准 OpenCat 产物：优先附着到恢复任务分支，继续清理与归档
- `trunk` 难以识别：优先依据远端 HEAD、本地默认分支和已有主 worktree 状态自主推断
- 删除分支可能影响当前上下文：优先先让 worktree 回到闲置态，再删除已确认合并的分支

只有在 Git / 文件系统层面已经无法继续执行任何收敛动作时，才允许结束本轮 cleanup；即便如此，也必须输出已完成动作、剩余异常和下次恢复入口，而不是向用户发问等待。

---

## 输出格式

### 执行中

```text
## OpenCat Cleanup

**Base:** <trunk>
**Active Changes:** <count>
**Target Worktree:** <path>
**Idle Branch:** <idle-branch>
**Current Branch:** <branch|detached>
**Decision:** auto-commit | continue-task | cleanup-merged | restore-idle

<进度说明>
```

### 完成后

- 扫描到的 worktree / 分支数量
- 发现并处理的 active OpenSpec changes
- 自动提交的未提交改动数量
- 继续执行的未合并任务
- 已清理的已合并任务分支
- 已恢复到闲置态的 worktree
- 是否已达到“可以执行 TODO List”的干净状态
- 已记录但未完全消除的问题（如有）

---

## 护栏规则

| 规则 | 说明 |
|------|------|
| 未提交先自动提交 | 发现未提交改动时，先自动提交，再决定后续动作 |
| 未合并先续做 | 有未合并任务提交时，必须继续 `opencat-task`，不能直接删 |
| OpenSpec 先收尾 | active change 未归档时，先实现并 archive，再清 Git 残留 |
| 已合并再清理 | 仅当确认已合并进 `trunk` 后，才删除任务分支 |
| 闲置分支是一等公民 | 每个保留 worktree 都必须有自己的 `idle branch` |
| 非闲置即任务态 | 只要不在 `idle branch`，该 worktree 就被视为仍在任务中 |
| 默认自主决断 | 遇到不确定状态时，不暂停问用户，优先选择最保守且可继续收敛的方案 |
| 先记录再继续 | 难以完全确认的问题先记录，再继续后续可执行清理动作 |
| 不删 worktree 目录 | 清理的是分支和状态，不是 worktree 目录 |
| 不重写主干历史 | 不删除 `trunk` 上已存在的提交 |
| 最终回到闲置态 | 保留 worktree 最终都应回到自己的 `idle branch`，而不是 `trunk` |

---

## 成功 / 失败条件

### 成功

- ✅ OpenSpec 中未归档的 active changes 已实现并归档
- ✅ 未合并的 OpenCat 任务没有被误删，而是转交子 Agent 继续执行
- ✅ 已合并的任务分支被删除
- ✅ 所有保留 worktree 都回到各自的 `idle branch`
- ✅ 所有保留 worktree 都是干净状态
- ✅ 仓库处于可安全进入下一轮 TODO 执行的状态

### 失败

- ❌ 还有 active change 未归档，却先做了表面分支清理
- ❌ 将未合并任务分支误判为已合并并删除
- ❌ 为了“删提交”而改写 `trunk` 历史
- ❌ 清理后 worktree 仍停留在任务分支、`trunk` 或 detached 状态
- ❌ 删除了本应保留复用的 worktree 目录

---

## Windows PowerShell 注意事项

- 使用 PowerShell 兼容命令，不依赖 bash heredoc
- 逐步执行 git 检查与清理，不把高风险命令串成不可中断的大命令
- 删除任务分支前先再次确认当前 worktree 已切回自己的 `idle branch` 且工作区干净
