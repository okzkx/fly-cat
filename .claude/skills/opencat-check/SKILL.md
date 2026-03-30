---
name: opencat-check
description: 检查并补齐 OpenCat / OpenSpec 环境。**严禁**把 detached、挂在 `trunk` 或脏的保留 worktree 当作可复用槽位；拓扑异常**必须**转交 `opencat-cleanup`。运行 `opencat-work` 或 `opencat-task` 前使用。
license: MIT
compatibility: 需要 shell 权限；当缺少工具或缺失 worktree 槽位元数据时，需要允许安装依赖或创建最小必要的分支 / worktree 元数据。
metadata:
  author: opencat
  version: "1.1"
---

在执行 OpenCat 工作流之前，先完成环境检查与安全引导修复。

## 🚨 核心不可违反规则

1. **严禁**把 detached、直接停在 `trunk`、或工作区脏的保留 worktree 当作可复用槽位。
2. 发现 worktree 拓扑异常时，**必须**转交 `opencat-cleanup`，不要临时发明破坏性修复。
3. 本技能只允许补齐最小必要元数据；**严禁**吞掉、覆盖或丢弃已有任务工作。
4. 只要前置条件还没补齐，就**不得**继续进入 `opencat-task`。
5. **必须**默认自主决断并继续完成剩余检查；最多记录环境限制，不因常规不确定性暂停询问用户。

适用场景：
- `opencat-work` 开始跑 TODO 队列之前
- 在运行 `opencat-task` 之前做前置检查
- 为 OpenSpec 工作流补齐缺失工具
- 修复 git、node、包管理器或 OpenSpec CLI 环境
- 校验保留中的 OpenCat worktree 是否处于合法的闲置态 / 任务态

## 调用约定

- `opencat-work` 在开始执行 TODO 队列前，先调用一次 `opencat-check`
- `opencat-task` 在进入 purpose / apply / archive 流程前，先调用一次 `opencat-check`
- `opencat-check` 只负责环境、依赖和 worktree 拓扑检查，不负责工程残留清理
- 一旦发现 retained worktree、任务分支或闲置槽位状态异常，应立即转交 `opencat-cleanup`

---

**输入**：当前仓库根目录，或用户希望准备好的目标仓库。

## 工作流程

1. **检查仓库上下文**

   - 确认目标目录就是预期仓库
   - 根据 lockfile 识别首选包管理器
   - 识别仓库真实的 `trunk` 分支
   - 检查 `git worktree list --porcelain`

2. **按顺序检查必需工具**

   检查：
   1. `git --version`
   2. `node --version`
   3. 根据 lockfile 推导出的首选包管理器版本
   4. `openspec --version`
   5. 若 `openspec` 不在 `PATH` 中，则执行 `npx openspec@latest --version`

3. **检查项目依赖**

   - 若项目依赖缺失，则使用从 lockfile 推导出的包管理器安装依赖
   - 若依赖已完整安装，不要为了保险而重复安装

4. **检查 OpenCat worktree 拓扑**

   对每个保留的 worktree 槽位，检查：

   - worktree 路径
   - 当前分支，或是否处于 detached 状态
   - `git status --short`
   - 是否存在与之配对的闲置分支

   必须满足以下不变量：

   1. 每个保留 worktree 槽位都必须有一个配对的闲置分支
      - 推荐命名：`opencat/idle/<slot-name>`
   2. 一个闲置 worktree 只有在以下条件都满足时才算合法：
      - 当前位于自己的闲置分支
      - `git status --short` 为空
   3. 一个忙碌中的 worktree 只有在以下条件都满足时才算合法：
      - 当前位于一个明确命名的任务分支上，例如 `opencat/<task-name>`
      - 不处于 detached 状态
   4. 保留 worktree 不允许长期处于以下状态：
      - detached HEAD
      - 直接停在 `trunk`
      - 在闲置分支上但工作区是脏的
      - 停在无法明确归属任务的未知分支上

5. **补齐缺失前置条件**

   若发现缺失项，先修复再继续：

   - 若缺少 `git`，优先用当前操作系统可用的包管理器安装，然后重新检查 `git --version`
   - 若缺少 `node` 或仓库所需包管理器，先安装对应运行时，再重新检查
   - 若缺少 OpenSpec，优先尝试无需全局安装的 `npx openspec@latest --version`
   - 若仍需要持久安装 OpenSpec，则执行 `npm install -g @fission-ai/openspec@latest`，然后重新验证 `openspec --version`

6. **补齐最小 worktree 槽位元数据**

   本技能只允许做小而安全的修复，且不能吞掉或丢弃任务工作：

   - 若某个保留 worktree 路径已经存在，但其配对闲置分支缺失，则基于当前 `trunk` 创建该闲置分支
   - 若仓库里还没有任何可复用 worktree 槽位，则创建第一个槽位，并同时创建其配对闲置分支

   本技能**不得**静默修复以下高风险残留状态：

   - 保留 worktree 处于 detached 状态
   - 闲置 worktree 处于脏状态
   - 保留 worktree 直接停在 `trunk`
   - 保留 worktree 停在一个仍有未完成工作的任务分支上

   这些状态都表示仓库**尚未就绪**，必须转交给 `opencat-cleanup` 处理。

7. **每次修复后重新验证**

   - 每完成一次安装或引导修复，都要立即重跑失败项检查
   - 只要仍有任何前置条件缺失或不可用，就不能报告成功

8. **汇总就绪状态**

   需要报告：

   - 哪些工具原本就可用
   - 本次运行期间安装了哪些工具或依赖
   - 哪些保留 worktree 已经处于 `idle-ready`
   - 是否有 worktree 必须先经过 `opencat-cleanup`
   - 当前环境是否已经可以运行 `opencat-task`
   - 是否仍有已记录但未自动消除的问题

## 护栏规则

- 优先使用仓库现有的包管理器，不要凭空换一套
- 只安装满足当前工作流所需的最小依赖
- 只要前置条件还没补齐，就不要继续进入 `opencat-task`
- 不要把 detached / 挂在 `trunk` / 脏的保留 worktree 当作可复用槽位
- 若 worktree 拓扑不健康，应转交 `opencat-cleanup`，不要临时发明破坏性修复
- 若安装需要管理员权限、联网批准，或涉及代理无法安全决定的系统级选择，不要暂停发问；应记录该环境限制，并继续完成剩余可执行检查
- 默认自主决断：遇到常规不确定性时，不等待用户确认，优先选择最保守且可继续的处理路径
- 每次安装或引导修复完成后，都要立即验证
