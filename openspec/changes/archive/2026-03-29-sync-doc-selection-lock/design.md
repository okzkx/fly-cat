## Design

### Approach

在 `buildTreeNodes` 函数中增加一个 `syncingKeys` 参数，当 `activeSyncTask` 存在且状态为 `pending` 或 `syncing` 时，将当前 `selectedSources` 的所有 key 视为同步锁定 key。被锁定的节点设置 `disableCheckbox: true`。

具体修改点：

1. **`HomePage.tsx` - `buildTreeNodes` 签名变更**：增加 `syncingKeys: Set<string>` 参数
2. **`HomePage.tsx` - `buildTreeData` 传递 `syncingKeys`**：当 `activeSyncTask` 激活时，将 `checkedSourceKeys` 作为 `syncingKeys` 传入
3. **`HomePage.tsx` - `disableCheckbox` 逻辑扩展**：在现有条件 (`bitable || isDisabledNode || isAlreadyDownloaded`) 基础上增加 `|| isSyncing`

### Key Decisions

- 复用现有的 `activeSyncTask` prop 判断同步是否激活，无需新增 state
- `syncingKeys` 直接取自 `checkedSourceKeys`（即 `selectedSources`），不需要额外维护
- 未被勾选的未同步文档节点不受影响，仍可自由勾选
