## Why

Icon and compact action buttons on the knowledge base home card and tree rows expose their meaning only through short labels or icons. Users who are unsure what each control does have no in-app explanation without clicking. Hover tooltips surface the same intent as the control labels in a consistent, discoverable way.

## What Changes

- Add Ant Design `Tooltip` help text on hover for the knowledge base home card bulk actions (**全部刷新**, **强制更新**, **批量删除**, **开始同步**).
- Add matching hover tooltips for per-row tree actions (**重新同步**, **在浏览器打开**, **使用默认应用打开** on documents, bitables, and folders) so behavior matches the home card pattern.
- Ensure tooltips remain usable where controls are disabled (wrap pattern as needed per Ant Design).

## Capabilities

### New Capabilities

_(none)_

### Modified Capabilities

- `knowledge-tree-display`: Add a requirement that primary sync-related buttons on the home card and knowledge tree rows expose short hover help that describes the action without changing click behavior or enable/disable rules.

## Impact

- Frontend: `src/components/HomePage.tsx` (imports, JSX around `KnowledgeTreeNodeTitle` and sync `Card` `extra` actions).
- Dependency: existing `antd` `Tooltip` (already available).
