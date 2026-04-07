## 1. Implementation

- [ ] 1.1 Refactor `TaskListPage` `Card` header: single `title` flex row with heading + toolbar (`清空所有任务`, `开始等待任务`, `返回首页`); remove reliance on `extra` + full-width title combo that clips actions.
- [ ] 1.2 Adjust `styles` on the card so title region does not ellipsize the combined header row.
- [ ] 1.3 Run `npm run typecheck` (and quick visual sanity check if dev server available).

## 2. Validation

- [ ] 2.1 `openspec validate --change restore-task-list-toolbar-actions`
