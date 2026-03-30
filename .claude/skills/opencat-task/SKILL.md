---
name: opencat-task
description: OpenSpec 分阶段工作流执行器。完成 purpose → apply → archive 全流程，**必须使用 worktree 隔离**、**核心约束：worktree 保留不删除**、**变更必须合并回主干**。适用于端到端的 OpenSpec 变更执行。
license: MIT
compatibility: 需要先手动运行 `opencat-check` 检查环境
metadata:
  author: opencat
  version: "2.0"
  derivedFrom: "openspec-all-in-one"
---

# OpenCat Task - OpenSpec 分阶段工作流

端到端执行 OpenSpec 变更：从提案到归档，带 Git 检查点和可复用 worktree 隔离。

---

## 输入

- 变更名称（kebab-case）
- 或自然语言描述（自动生成变更名称）

---

## 核心概念

| 术语 | 说明 |
|------|------|
| `purpose stage` | 提案阶段，创建变更文档（proposal、design、specs、tasks） |
| `apply stage` | 实现阶段，按 tasks.md 执行代码修改 |
| `archive stage` | 归档阶段，生成变更报告并归档 |
| `trunk` | 基础分支，通常是 `main` 或 `master` |
| `worktree` | Git 工作树副本，用于隔离实现工作 |

---

## 工作流程

### 阶段概览

```
purpose → validate → commit → worktree → apply → validate → commit
    → rebase → archive → commit → merge → cleanup
```

### 详细步骤

#### 1. 分类请求

**简单变更**（满足多数条件）：
- 小修复、小功能、文档/配置修改
- 单一明确目标
- 模块影响有限

**复杂变更**（满足任一条件）：
- 跨模块工作
- 涉及设计权衡
- 范围模糊

> 不确定时归类为「复杂」

#### 2. 准备 Git 计划（主 worktree）

```bash
# 记录当前分支作为 base_branch
# 检查 git status --short
# 检查 git worktree list --porcelain
```

派生：
- `work_branch`: 临时分支名，如 `opencat/<change-name>`
- `worktree_path`: 可复用的 sibling worktree 路径

#### 3. Purpose 阶段（主 worktree）

**在主 worktree 中**调用 `openspec-propose` skill。

> ⚠️ 此时不要创建 worktree

#### 4. 验证 Purpose

```bash
openspec validate --change "<name>"
```

失败则修复后重试。

#### 5. 创建 Purpose 提交

验证通过后：
- 创建并切换到 `<work_branch>`
- 暂存 purpose 相关文件
- 提交：`[propose] <change-name>: <描述>`
- 切回 `<base_branch>`

#### 6. 准备 Worktree

查找可复用的 worktree（按优先级）：
1. `../<repo-name>-worktree`
2. `../<repo-name>-worktree-2`
3. `../<repo-name>-worktree-3`
4. ...

复用条件：
- 路径存在 ✓
- 在 `<base_branch>` 上 ✓
- 工作区干净 ✓

如果被占用（在别的分支上），则创建下一个。

在 worktree 中切换到 `<work_branch>`。

#### 6.5 开发前先 Rebase 到主干

在 worktree 中正式开始 apply 阶段开发前，必须先把工作分支变基到最新 `<base_branch>`：

```bash
# 主 worktree 中
git fetch
git pull --ff-only  # 刷新 trunk

# worktree 中
git rebase <base_branch>
```

若有冲突，AI 默认自行解决并继续 rebase；除非仓库状态无法安全恢复，不因常规冲突暂停等待确认。

#### 7. Apply 阶段（Worktree）

**在 worktree 中**调用 `openspec-apply-change` skill。

#### 8. 验证 Apply

```bash
openspec validate --change "<name>"
```

#### 9. 创建 Apply 提交

```bash
git add <相关文件>
git commit -m "[apply] <change-name>: <描述>"
```

#### 10. 合并前再次刷新主干并 Rebase

```bash
# 主 worktree 中
git fetch
git pull --ff-only  # 刷新 trunk

# worktree 中
git rebase <base_branch>
```

有冲突则**永远先 rebase 到最新提交并自行解决**，除非仓库状态无法恢复。

#### 11. Archive 阶段（Worktree）

调用 `openspec-archive-change` skill。

生成中文报告 `change-report.zh-CN.md`，包含：
- 基本信息
- 变更动机
- 变更范围
- 规格影响
- 任务完成情况

#### 12. 创建 Archive 提交

```bash
git add <archive 相关文件>
git commit -m "[archive] <change-name>: <中文标题>"
```

#### 13. 合并回主干（主 Worktree）

```bash
git checkout <base_branch>
git merge --no-ff "<work_branch>"
```

无论是否观察到主干推进，只要准备合并回 `<base_branch>`，都先确保工作分支已经 rebase 到最新 `<base_branch>`；若 rebase 或 merge 有冲突，AI 默认自行解决并继续，不因常规冲突停下来等待确认。

#### 14. 清理

- **确保 worktree 内的所有变更都已提交**
- worktree 切回 `<base_branch>`
- 删除 `<work_branch>` 分支
- **保留 worktree 目录供下次使用**

#### 15. 验证清理

- 确认分支已删除
- 确认 worktree 在 base 分支且干净
- 确认无孤立归档目录
- 确认 worktree 目录还保留

---

## Git 提交规范

### 三个检查点提交

| 提交 | 格式 |
|------|------|
| Purpose | `[propose] <name>: <描述>` |
| Apply | `[apply] <name>: <描述>` |
| Archive | `[archive] <name>: <中文标题>` |

### 提交前检查

- 检查 `git status`、`git diff`、`git log`
- 只暂存相关文件
- 不提交构建产物、缓存、密钥

---

## Worktree 规范

### 命名约定

- 主 worktree: 项目根目录
- 可复用 worktree: `../<repo-name>-worktree`
- 备用 worktree: `../<repo-name>-worktree-2`、`../<repo-name>-worktree-3` ...

### 生命周期

```
创建/复用 → apply → rebase → archive → 切回 base → 保留
```

> ⚠️ **绝不删除 worktree 目录**，它们设计为可复用

---

## 暂停条件

遇到以下情况暂停并询问用户：

- 请求太模糊无法安全提案
- 发现影响范围或行为的重大决策
- 验证无法自信修复
- 提交会混入无关更改
- 主干刷新无法安全完成
- 所有 worktree 候选都不安全
- 基础分支 detached 或不明确
- 分支名与现有状态冲突

---

## 输出格式

### 执行中

```text
## OpenCat Work

**Change:** <name>
**Complexity:** simple|complex
**Base:** <base-branch>
**Worktree Branch:** <work-branch>
**Stage:** purpose|apply|archive|...

<进度说明>
```

### 完成后

- 变更名称
- 基础分支
- 工作分支
- 各阶段提交是否成功
- 验证是否通过
- 归档是否完成
- 中文报告是否生成
- 合并是否成功
- 分支是否删除
- 清理验证是否通过
- 使用的 worktree 路径
- 剩余问题（如有）

---

## 护栏规则

| 规则 | 说明 |
|------|------|
| worktree 保留 | 合并后只删除分支，保留 worktree 目录 |
| 调用现有技能 | 直接调用 `openspec-propose/apply/archive` |
| 开发前先 rebase | 在工作分支开始 apply 开发前，先 rebase 到最新 `<base_branch>` |
| 永远先 rebase | 遇到主干推进、分支分叉、rebase/merge 冲突时，先 rebase 到最新提交，再自行解决冲突 |
| 冲突自解 | 默认自行解决 rebase/merge 冲突，不因常规冲突暂停 |
| 不重写历史 | 不修改 `<base_branch>` 历史 |
| 不自动推送 | 除非用户明确要求 |

---

## 成功/失败条件

### 成功 (SUCCESS)

- ✅ 三个检查点提交全部创建
- ✅ 验证全部通过
- ✅ 变更合并到主干
- ✅ worktree 目录保留
- ✅ 中文归档报告生成

### 失败 (FAILURE)

- ❌ worktree 目录被删除 → 记录严重违规，继续执行
- ❌ 未合并到主干直接推送 → 记录警告，继续执行
- ❌ 混入无关更改到提交 → 记录警告，继续执行
- ❌ 分支未删除造成残留 → 记录残留，继续执行

---

## Windows PowerShell 注意事项

- 不使用 bash heredoc `$(cat <<'EOF' ...)`
- 使用 PowerShell here-string 或多个 `-m` 参数
- 不用 `&&` 链接命令，用分步或 `$LASTEXITCODE`