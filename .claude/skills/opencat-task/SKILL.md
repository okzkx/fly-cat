---
name: opencat-task
description: OpenSpec 分阶段工作流执行器。**必须**先调用 `opencat-check` 做环境检查、**必须**使用 worktree 隔离并合并回主干、**必须**在结束时调用 `opencat-cleanup` 归还闲置态。
license: MIT
compatibility: 运行前先用 `opencat-check` 检查环境与 worktree 拓扑；若发现残留任务、detached worktree 或脏闲置 worktree，先执行 `opencat-cleanup`
metadata:
  author: opencat
  version: "2.1"
  derivedFrom: "openspec-all-in-one"
---

# OpenCat Task - OpenSpec 分阶段工作流

端到端执行 OpenSpec 变更：从提案到归档，使用“可复用 worktree 槽位 + 闲置分支 / 任务分支”两态模型隔离实现工作。环境检查统一交给 `opencat-check`，收尾与工程清理由 `opencat-cleanup` 负责。

## 🚨 核心不可违反规则

1. **必须**先调用 `opencat-check`；若环境、依赖或 worktree 拓扑不健康，先修复或转交 `opencat-cleanup`，再继续任务。
2. **必须**使用 worktree 隔离执行 apply / archive 阶段，严禁直接在主 worktree 里完成整条任务链。
3. **必须**把任务变更合并回 `trunk`，严禁停留在未合并任务分支就把流程视为完成。
4. **必须**在流程结束时调用 `opencat-cleanup`，由它统一删除任务分支、恢复 `idle branch` 和清理工程状态。
5. **必须**在开发前和合并前都先 rebase 到最新主干；遇到常规冲突时，默认自行解决并继续。
6. **必须**默认自主决断并继续推进；最多记录问题，不因常规不确定性暂停询问用户。

---

## 输入

- 变更名称（kebab-case）
- 或自然语言描述（自动生成变更名称）

---

## 核心概念

| 术语 | 说明 |
|------|------|
| `purpose stage` | 提案阶段，创建 change 文档（proposal、design、specs、tasks） |
| `apply stage` | 实现阶段，按 `tasks.md` 执行代码修改 |
| `archive stage` | 归档阶段，生成变更报告并归档 |
| `trunk` | 基础分支，通常是 `main` 或 `master` |
| `worktree slot` | 一个可反复复用的保留 worktree 路径，例如 `../<repo-name>-worktree-2` |
| `idle branch` | 与某个 worktree slot 一一对应的闲置分支，例如 `opencat/idle/<slot-name>`；该 worktree 空闲时必须停在这个分支上 |
| `task branch` | 当前任务对应的工作分支，命名为 `opencat/<change-name>` |
| `idle state` | worktree 当前在自己的 `idle branch` 上，且 `git status --short` 为空 |
| `task state` | worktree 当前不在 `idle branch` 上，而是在某个明确的 `task branch` 上；只要不处于闲置分支，就视为该 worktree 正在承接任务 |

---

## 状态机约束

1. 创建或首次发现一个保留 worktree slot 时，必须同时存在它的同名槽位闲置分支。
   - 推荐命名：worktree 路径名 `feishu_docs_sync-worktree-2`
   - 配对闲置分支：`opencat/idle/feishu_docs_sync-worktree-2`
2. worktree 空闲时，必须满足以下全部条件：
   - 当前分支是该 slot 的 `idle branch`
   - 所有任务变更都已经提交并合并回 `trunk`
   - `git status --short` 为空
3. worktree 领到任务后，必须切换到该任务的 `task branch`；此时它就进入 task state。
4. 保留 worktree 绝不允许长期处于以下状态：
   - detached HEAD
   - 直接停留在 `trunk`
   - 在 `idle branch` 上但工作区脏
   - 停在无法解释的匿名提交上
5. 任务结束后的标准收尾是：
   - merge 回 `trunk`
   - 删除 `task branch`
   - 切回配对的 `idle branch`
   - 让 `idle branch` 对齐最新 `trunk`
   - 确认 worktree 干净

---

## 工作流程

### 阶段概览

```text
check-env → purpose → validate → propose-commit → claim-idle-slot → rebase
    → apply → validate → apply-commit → rebase → archive
    → archive-commit → merge → cleanup
```

### 详细步骤

#### 1. 环境检查

在真正进入任务流程前，**先调用 `opencat-check`**：

- 验证 git / node / 包管理器 / OpenSpec CLI / 项目依赖是否就绪
- 验证 retained worktree、`idle branch`、`task branch` 拓扑是否健康
- 若 `opencat-check` 判定仓库存在残留任务、detached worktree、脏闲置槽位或其他拓扑异常，先转交 `opencat-cleanup`
- 只有 `opencat-check` 报告“当前可以运行 `opencat-task`”后，才进入下面步骤

#### 2. 分类请求

**简单变更**（满足多数条件）：
- 小修复、小功能、文档/配置修改
- 单一明确目标
- 模块影响有限

**复杂变更**（满足任一条件）：
- 跨模块工作
- 涉及设计权衡
- 范围模糊

> 不确定时归类为“复杂”

#### 3. 准备 Git 计划（主 worktree）

必须先在主 worktree 中记录并检查：

- `base_branch` / `trunk`
- `git status --short`
- `git branch --all`
- `git worktree list --porcelain`

派生：

- `task_branch`: `opencat/<change-name>`
- `worktree_path`: 将要承接本任务的 slot 路径
- `idle_branch`: 该 slot 配对的闲置分支，固定为 `opencat/idle/<slot-name>`

#### 4. Purpose 阶段（主 worktree）

**在主 worktree 中**调用 `openspec-propose` skill。

> 此时不要先把某个保留 worktree 抢占为任务态；先完成 purpose 文档与验证。

#### 5. 验证 Purpose

```text
openspec validate --change "<name>"
```

失败则修复后重试。

#### 6. 创建 Purpose 提交

验证通过后：

- 创建或更新 `<task_branch>`，基线应来自最新 `<base_branch>`
- 暂存 purpose 相关文件
- 提交：`[propose] <change-name>: <描述>`
- 主 worktree 切回 `<base_branch>`

#### 7. 领取 Worktree Slot

查找可复用的 worktree slot（按优先级）：

1. `../<repo-name>-worktree`
2. `../<repo-name>-worktree-2`
3. `../<repo-name>-worktree-3`
4. ...

每个 slot 都必须满足“路径 + 闲置分支”配对关系：

- `worktree_path = ../<slot-name>`
- `idle_branch = opencat/idle/<slot-name>`

**可复用条件**：

- 路径存在，或这是将要新建的下一个 slot
- 配对的 `idle_branch` 已存在，或本次会同时创建
- 当前 worktree 处于 `idle_branch`
- `git status --short` 为空

**若 slot 路径不存在**：

- 先基于最新 `<base_branch>` 创建配对的 `idle_branch`
- 再创建 worktree，并让它直接检出到这个 `idle_branch`

**若 slot 已存在但不满足可复用条件**：

- 不在本技能里硬修复
- 立刻转交 `opencat-cleanup`
- 只有 cleanup 把该 slot 恢复到 idle state 后，才允许继续领取它

#### 8. 让 slot 进入任务态

选定 slot 后：

- 在主 worktree 刷新 `<base_branch>`
- 确认 `<task_branch>` 已包含最新 purpose commit
- 在目标 worktree 中从 `idle_branch` 切换到 `<task_branch>`
- 从这一刻起，该 worktree 就处于 task state

#### 9. 开发前先 Rebase 到主干

在 worktree 中正式开始 apply 阶段前，必须先把 `task_branch` 变基到最新 `<base_branch>`：

```text
# 主 worktree 中刷新 trunk
git fetch
git pull --ff-only

# 目标 worktree 中
git rebase <base_branch>
```

若有冲突，AI 默认自行解决并继续 rebase；除非仓库状态无法安全恢复，不因常规冲突暂停等待确认。

#### 10. Apply 阶段（Worktree）

**在目标 worktree 中**调用 `openspec-apply-change` skill。

#### 11. 验证 Apply

```text
openspec validate --change "<name>"
```

#### 12. 创建 Apply 提交

```text
git add <相关文件>
git commit -m "[apply] <change-name>: <描述>"
```

#### 13. 合并前再次刷新主干并 Rebase

```text
# 主 worktree 中刷新 trunk
git fetch
git pull --ff-only

# 目标 worktree 中
git rebase <base_branch>
```

有冲突则**永远先 rebase 到最新提交并自行解决**，除非仓库状态无法恢复。

#### 14. Archive 阶段（Worktree）

调用 `openspec-archive-change` skill。

生成中文报告 `change-report.zh-CN.md`，至少包含：

- 基本信息
- 变更动机
- 变更范围
- 规格影响
- 任务完成情况

#### 15. 创建 Archive 提交

```text
git add <archive 相关文件>
git commit -m "[archive] <change-name>: <中文标题>"
```

#### 16. 合并回主干（主 worktree）

```text
git checkout <base_branch>
git merge --no-ff "<task_branch>"
```

无论是否观察到主干推进，只要准备合并回 `<base_branch>`，都先确保 `<task_branch>` 已经 rebase 到最新 `<base_branch>`；若 rebase 或 merge 有冲突，AI 默认自行解决并继续，不因常规冲突停下来等待确认。

#### 17. 结束时调用 `opencat-cleanup`

任务 merge 回主干后，不在本技能里重复实现工程清理细节，而是**统一调用 `opencat-cleanup`**：

- 删除已完成的任务分支
- 把承接任务的 worktree 归还到自己的 `idle branch`
- 确认 retained worktree 全部回到干净、可复用状态
- 收尾任何中途遗留的工程残留

本技能只要求 cleanup 完成后满足以下结果：

- `<task_branch>` 已删除
- 相关 worktree 已回到自己的 `idle_branch`
- 工作区干净
- worktree 目录仍然保留

---

## Git 提交规范

### 三个检查点提交

| 提交 | 格式 |
|------|------|
| Purpose | `[propose] <name>: <描述>` |
| Apply | `[apply] <name>: <描述>` |
| Archive | `[archive] <name>: <中文标题>` |

### 提交前检查

- 检查 `git status`
- 检查 `git diff`
- 检查 `git log`
- 只暂存相关文件
- 不提交构建产物、缓存、密钥

---

## Worktree 规范

### 命名约定

- 主 worktree: 项目根目录
- worktree slot: `../<repo-name>-worktree`、`../<repo-name>-worktree-2`、`../<repo-name>-worktree-3` ...
- slot 对应闲置分支: `opencat/idle/<slot-name>`
- 任务分支: `opencat/<change-name>`

### 生命周期

```text
创建 slot+idle_branch
→ 闲置态（idle_branch, clean）
→ 切到 task_branch 承接任务
→ apply / archive / merge
→ 切回 idle_branch
→ 再次闲置待命
```

> 绝不删除 worktree 目录；但也绝不允许保留 worktree 长期停在 detached / trunk / 脏状态。

---

## 自主决断规则

本技能默认**不暂停、不询问用户、不等待确认**。

遇到不确定情况时，必须按以下优先级自主决断：

1. 选择最保守、最不破坏主干历史的继续路径
2. 尽量保留现有提交、分支承载关系与 worktree 目录
3. 若有多个可行方案，优先选择更容易回到“任务完成并归还闲置态”的方案
4. 若当前步骤无法完美完成，也先记录问题并推进后续仍可执行的步骤

典型场景的默认决策：

- 请求仍偏模糊：先收敛为最小可执行 change，再继续 purpose
- 发现重大设计权衡：采用最小改动、最小行为变化方案
- 验证无法完全自信：先做最可能正确的修复并补充验证，再继续
- 提交可能混入无关更改：优先缩小暂存范围；若仍无法完全剥离，则记录风险后用最小安全集合提交
- 主干刷新困难：优先 `fetch` / `rebase` / 自行解冲突；无法完全刷新时记录风险并继续当前可安全步骤
- 没有可用 idle slot：优先新建下一个 slot 与配对 `idle_branch`
- `idle_branch` 缺失：基于最新 `trunk` 自动补建
- `task_branch` 命名冲突：优先复用同任务分支；若状态不兼容，则自动派生一个带后缀的任务分支继续

只有在工具、文件系统或 Git 本身已经无法继续执行任何有效操作时，才允许结束本轮流程；即便如此，也应输出已完成步骤、已记录问题和建议的下一次恢复起点，而不是向用户追问。

---

## 输出格式

### 执行中

```text
## OpenCat Task

**Change:** <name>
**Complexity:** simple|complex
**Base:** <base-branch>
**Task Branch:** <task-branch>
**Worktree Slot:** <worktree-path>
**Idle Branch:** <idle-branch>
**Stage:** purpose|apply|archive|merge|return-to-idle

<进度说明>
```

### 完成后

- 变更名称
- 基础分支
- 任务分支
- 使用的 worktree 路径
- 配对的闲置分支
- 各阶段提交是否成功
- 验证是否通过
- 归档是否完成
- 中文报告是否生成
- 合并是否成功
- 任务分支是否删除
- worktree 是否回到闲置态
- 剩余问题（如有）

---

## 护栏规则

| 规则 | 说明 |
|------|------|
| 环境检查外置 | git / node / OpenSpec / 依赖 / worktree 拓扑检查统一交给 `opencat-check` |
| 工程清理外置 | 任务结束后的分支删除、归还闲置态和工程收尾统一交给 `opencat-cleanup` |
| worktree 保留 | 合并后保留 worktree 目录，供下次复用 |
| 必须有闲置分支 | 每个保留 worktree slot 都必须有自己的 `idle_branch` |
| 闲置必须干净 | worktree 空闲时，必须在 `idle_branch` 且 `git status --short` 为空 |
| 非闲置即任务态 | 只要不在 `idle_branch`，该 worktree 就必须是在明确的 `task_branch` 上 |
| 禁止 detached/trunk 待命 | 保留 worktree 不允许以 detached HEAD 或直接停在 `trunk` 的方式待命 |
| 默认自主决断 | 遇到不确定情况时，不暂停问用户，优先选择最保守且可继续的方案 |
| 先记录再继续 | 无法完美处理的问题先记录到输出中，再继续后续可执行步骤 |
| 调用现有技能 | 直接调用 `openspec-propose` / `openspec-apply-change` / `openspec-archive-change` |
| 开发前先 rebase | 在 `task_branch` 开始 apply 开发前，先 rebase 到最新 `<base_branch>` |
| 永远先 rebase | 遇到主干推进、分支分叉、rebase/merge 冲突时，先 rebase 到最新提交，再自行解决冲突 |
| 冲突自解 | 默认自行解决 rebase/merge 冲突，不因常规冲突暂停 |
| 不重写历史 | 不修改 `<base_branch>` 历史 |
| 不自动推送 | 除非用户明确要求 |

---

## 成功 / 失败条件

### 成功 (SUCCESS)

- ✅ 三个检查点提交全部创建
- ✅ 验证全部通过
- ✅ 变更合并到主干
- ✅ worktree 目录保留
- ✅ 中文归档报告生成
- ✅ `task_branch` 已删除
- ✅ worktree 已回到配对的 `idle_branch`

### 失败 (FAILURE)

- ❌ worktree 目录被删除
- ❌ 未合并到主干直接结束流程
- ❌ 混入无关更改到提交
- ❌ 任务完成后 worktree 仍停在任务分支、主干或 detached 状态
- ❌ `idle_branch` 缺失或无法恢复

---

## Windows PowerShell 注意事项

- 不使用 bash heredoc `$(cat <<'EOF' ...)`
- 使用 PowerShell here-string 或多个 `-m` 参数
- 不用 `&&` 链接命令，用分步或 `$LASTEXITCODE`