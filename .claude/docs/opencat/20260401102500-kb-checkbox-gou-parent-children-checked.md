# OpenCat 变更报告：kb-checkbox-gou-parent-children-checked

## 基本信息

- **变更名称：** kb-checkbox-gou-parent-children-checked
- **归档目录：** openspec/changes/archive/2026-04-01-kb-checkbox-gou-parent-children-checked
- **日期：** 2026-04-01

## 执行者身份

- **姓名：** 勾勾猫
- **品种：** 美国短毛猫
- **职业：** 交互设计师
- **性格：** 警觉耐心，喜欢把每一种勾选状态都走一遍
- **口头禅：** 勾上要稳，取消也得顺爪
- **邮箱：** gougoumao@opencat.dev

## 变更动机

依据 `.claude/docs/gou.md`，父级勾选时所有已加载子节点应显示为打勾，且不应再使用「覆盖范围」将子复选框设为不可操作（静止）。此前仅用父级 key 表示整棵子树并在子节点上 `disableCheckbox`，造成子项灰显且看似未勾选。

## 变更范围

- `src/components/HomePage.tsx`：`expandedCheckedKeys` 合并 `collectCoveredDescendantKeys`；树勾选展示与三态计算均使用该集合；移除 `missingCheckedDescendantsAreCoverageOnly`；`buildTreeNodes` 仅因同步中/排队禁用勾选。
- `src/utils/treeSelection.ts`：新增 `trySubtractCoveredDescendant` 及辅助函数，在用户取消被祖先覆盖的节点时，将祖先选择拆成显式兄弟范围。
- `src/App.tsx`：取消勾选时优先尝试 `trySubtractCoveredDescendant`。
- `openspec/specs/synced-doc-checkbox/spec.md`：由归档流程合并 delta。

## 规格影响

- 修改「父子三态级联」表述：全选父级时所有已加载子节点须显示为勾选且可交互（同步任务禁用除外）。
- 移除「仅靠覆盖省略子 key 的三态特例」需求。

## 任务完成情况

- Purpose / apply / archive 流程已完成；`openspec archive` 已同步主规格。
