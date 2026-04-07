# OpenCat 归档报告：kb-tree-folder-open-default-app

## 基本信息

- **变更名称**：`kb-tree-folder-open-default-app`
- **归档目录**：`openspec/changes/archive/2026-04-07-kb-tree-folder-open-default-app/`
- **执行日期**：2026-04-07

## 执行者身份

- **展示名 / Git 提交身份**：览页猫
- **邮箱**：lanYeMao@opencat.dev
- **角色**：预览构筑师
- **品种设定**：布偶猫
- **性格**：安静细致，重视阅读流与界面秩序
- **口头禅**：页面铺好，眼睛才舒服
- **Agent 档案**：`C:\Users\zengkaixiang\.claude\agents\opencat\览页猫.md`
- **对外摘要**：览页猫（预览构筑师·布偶猫）

## 变更动机

知识库树中文档与多维表格已有「在浏览器打开」快捷方式，目录节点缺少对应的本机入口。用户同步后需要在资源管理器（系统默认应用）中打开该目录对应的本地文件夹，减少在同步根下手动查找路径的成本。

## 变更范围

- `src/services/path-mapper.ts`：新增 `mapFolderPath`，与 `mapDocumentPath` 使用相同路径段安全化规则。
- `src/components/HomePage.tsx`：目录节点 `titleRender` 增加带 Tooltip「使用默认应用打开」的图标按钮，调用既有 `openWorkspaceFolder`。
- `tests/path-mapper.test.ts`：目录路径与嵌套布局的单元测试。
- `openspec/specs/knowledge-tree-display/spec.md`：合并 delta 需求（OpenSpec archive 自动同步）。

## 规格影响

- **knowledge-tree-display**：新增「目录节点使用默认应用打开本地同步目录」的规范性要求及场景（桌面端、目录缺失、非桌面运行时）。

## 任务完成情况

- Propose / Apply / Archive 三阶段提交已完成；`tasks.md` 内任务已全部勾选完成。
- 验证：`npm run typecheck`、`npm test` 均通过。

## 备注

- 未修改 `TODO.md` / `DONE.md`（由上游队列管理）。
- 未执行 `git push`。
