## 基本信息

- 变更名称：`browser-safe-hashing`
- 归档时间：`2026-04-07 12:08`
- 基础分支：`master`
- 任务分支：`opencat/browser-safe-hashing`
- 执行模式：`branch`
- 归档目录：`openspec/changes/archive/2026-04-07-browser-safe-hashing/`

## 执行者身份信息

- 展示名：`览页猫`
- Git 邮箱：`lanYeMao@opencat.dev`
- 角色标签：`OpenCat Task 执行者`

## 变更动机

前端首页会在加载 `src/services/path-mapper.ts` 时触发 Vite 对 `node:crypto` 的浏览器兼容外置错误，导致桌面应用 UI 直接报错。该模块实际只需要稳定的短后缀和本地路径拼接能力，没有必要依赖 Node 内置哈希与路径模块。

## 变更范围

- 将 `src/services/path-mapper.ts` 改为纯前端可运行实现，移除 `node:crypto` 与 `node:path` 依赖。
- 为路径拼接补充浏览器安全的本地路径拼接逻辑，保留 Windows 与类 Unix 路径输出语义。
- 在 `tests/path-mapper.test.ts` 中补充 Windows 路径和稳定后缀回归测试。
- 新增并归档 OpenSpec change `browser-safe-hashing`，同步主规格 `openspec/specs/browser-compatible-client-utilities/spec.md`。

## 规格影响

- 新增 capability：`browser-compatible-client-utilities`
- 新 requirement：浏览器加载的客户端工具不得依赖 Node-only crypto API，路径冲突后缀必须在不依赖 `node:crypto` 的情况下保持稳定、可重复
- 主规格已在 archive 阶段同步到 `openspec/specs/browser-compatible-client-utilities/spec.md`

## 任务完成情况

- `[propose]` 阶段已完成：OpenSpec proposal / design / spec / tasks 已创建并通过校验
- `[apply]` 阶段已完成：浏览器兼容修复与测试已落地
- `[archive]` 阶段已完成：change 已归档，主规格已同步

## 验证结果

- `openspec validate "browser-safe-hashing" --type change`
- `npx vitest run tests/path-mapper.test.ts`
- `npm run build`

上述验证均已通过。
