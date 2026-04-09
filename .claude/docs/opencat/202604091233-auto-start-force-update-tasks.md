# auto-start-force-update-tasks — 归档报告

## 基本信息

- **变更名称**: `auto-start-force-update-tasks`
- **归档目录**: `openspec/changes/archive/2026-04-09-auto-start-force-update-tasks/`
- **日期**: 2026-04-09 12:33

## 执行者

- **展示名 / Git user.name**: 回环猫
- **Git user.email**: huihuanmao@opencat.dev
- **角色**: 界面魔法师
- **品种**: 暹罗猫
- **性格**: 机敏专注，偏爱小而准的交互设计
- **口头禅**: 轻点一下，流程再转一圈

## 变更动机

强制更新会先创建一个替换同步任务，再等待元数据刷新结束后继续启动它。现有实现没有复用任务列表里“开始等待任务”的那条恢复路径，导致正常成功链路里偶发停在 `pending`，用户还得自己去任务页手动点开始。

## 变更范围

- `src/App.tsx`：普通首页建任务改为 fire-and-forget 启动，避免首页成功提示被同步启动调用额外串行阻塞。
- `src/components/HomePage.tsx`：强制更新成功后不再单独按 task id 启动，而是复用待处理任务的 `resume` 路径，并把成功文案改成“已自动开始替换同步任务”。
- `src/types/app.ts`：把 Home 页传入回调从单任务启动改成恢复 pending 任务，收敛首页与任务页的启动语义。
- `openspec/specs/knowledge-tree-display/spec.md`：主规格新增 requirement，明确强制更新排出的替换任务必须自动进入启动链路，而不是要求用户再点击任务页开始按钮。

## 规格影响

- `knowledge-tree-display` 现在明确要求：强制更新在成功排出替换任务后，必须自动走与任务列表手动恢复一致的启动路径；手动恢复按钮只保留给中断/恢复场景。

## 任务完成情况

- OpenSpec propose / apply / archive 流程已完成。
- `openspec archive "auto-start-force-update-tasks" -y` 已执行，并已将 delta spec 合并回主规格。

## 验证

- 代码复核确认根因：强制更新成功链路调用的是单任务 `start`，而任务列表手动恢复调用的是 `resume`，两条启动路径不一致。
- `npm run typecheck`
- `npm test`
- `openspec validate "auto-start-force-update-tasks" --type change`

## 剩余风险

- 本次修复依赖“强制更新开始前不存在其他 `pending` / `syncing` 任务”的既有守卫，因此自动恢复仍然是“恢复所有 pending 任务”的语义；如果未来放宽该守卫，需重新收窄这条恢复调用的作用范围。
