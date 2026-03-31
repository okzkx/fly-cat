## 1. Specs and validation

- [x] 1.1 Add delta specs under `specs/` and run `openspec validate --change kb-checkbox-decouple-batch`

## 2. Frontend behavior

- [x] 2.1 HomePage: `allCheckedKeys` 仅来自 `selectedSources`；移除 `uncheckedSyncedDocKeys`、`syncedDocTreeKeys` 合并与相关 `useMemo`/级联更新块
- [x] 2.2 HomePage: 新增批量删除按钮；收集勾选范围内已同步且非同步中/等待中的 documentId，调用新回调
- [x] 2.3 types: `onCreateTask()` 无参；新增 `onBatchDeleteCheckedSyncedDocuments`
- [x] 2.4 App: `onCreateTask` 不再清理未勾选；实现批量删除回调（`removeSyncedDocuments` + 刷新 manifest 状态）

## 3. Cleanup

- [x] 3.1 移除 `syncStart.ts` 与 `sync-start.test.ts`（或等价测试调整）

## 4. Verification

- [x] 4.1 运行 `npm test`（或项目约定测试命令）
