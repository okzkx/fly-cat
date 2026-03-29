## Design

### 数据流

```
manifest (.feishu-sync-manifest.json)
  └─ get_document_sync_statuses (Tauri command)
      └─ documentSyncStatuses: Map<documentId, DocumentSyncStatus>
          └─ App.tsx (state, loaded on mount + refreshed on task events)
              └─ HomePageProps.documentSyncStatuses
                  └─ HomePage.titleRender → Tag display
```

### 类型设计

```typescript
interface DocumentSyncStatus {
  status: "synced" | "failed";
  lastSyncedAt: string; // ISO 8601
}
```

manifest 中有记录的文档标记为 `synced` 或 `failed`（取 `ManifestRecord.status`），无记录的文档为"未同步"。同步中的状态从当前活跃 `SyncTask` 的 `counters` 推导。

### 显示规则

| 节点类型 | 显示标签 | 说明 |
|----------|----------|------|
| document（已同步） | 绿色 Tag `已同步 MM-DD HH:mm` | manifest 中 status=success |
| document（同步失败） | 红色 Tag `失败` | manifest 中 status=failed |
| document（同步中） | 蓝色 Tag `同步中 X/Y` | 在当前活跃任务的 selectedSources 中 |
| document（未同步） | 灰色 Tag `未同步` | 不在 manifest 中且非当前同步目标 |
| folder | 不显示 | 目录无独立的同步状态 |
| space | 不显示 | 知识空间无独立的同步状态 |
| bitable | 不显示 | 多维表格不可同步 |

### UI 布局

```
📄 文档标题  [已同步 03-28 14:30]
```

标签使用 Ant Design `Tag` 组件，紧凑显示在标题右侧，字号小（`11px`），不换行。
