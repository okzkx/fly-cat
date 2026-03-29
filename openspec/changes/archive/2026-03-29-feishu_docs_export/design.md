# Design: feishu_docs_export

## Approach

### 1. 移除固定延迟

删除 `commands.rs:2037` 的 `std::thread::sleep(Duration::from_millis(400))`。飞书 API 本身有频率限制，retry 机制已经能处理限流错误，不需要额外固定延迟。

### 2. 并行文档处理

在 `spawn_sync_progress` 中，将串行 for 循环替换为基于 `std::thread::scope` 的并行处理：

```rust
std::thread::scope(|s| {
    for document in queued_documents.chunks(concurrency) {
        let handles: Vec<_> = chunk.iter().map(|doc| {
            s.spawn(|| process_single_document(doc, ...))
        }).collect();
        for handle in handles {
            let result = handle.join().unwrap();
            // update task counters and emit progress
        }
    }
});
```

- 默认并发数 `concurrency = 4`，避免过多并发触发飞书 API 限流
- 每个 chunk 处理完后汇总结果、更新计数器、发送进度事件
- 这样进度事件频率降低（每 concurrency 个文档一次），减少前端事件风暴

### 3. 批量 Manifest 写入

当前每个文档处理完都会调用 `save_manifest`。改为：

- 在 `SyncWriteResult` 中增加一个标志，表示是否需要立即写 manifest
- `sync_document_to_disk` 不再自动写 manifest，返回需要更新的 record
- 上层调用者负责批量写入：每 10 个文档写一次，或全部完成后写一次
- 通过新增 `upsert_manifest_record_in_memory` 函数（只修改 manifest 结构体，不写磁盘）实现

### 4. 数据流变化

**Before:**
```
for each document:
    sleep 400ms
    fetch -> render -> write md -> write images -> write manifest -> emit progress
```

**After:**
```
manifest = load_manifest()  // load once at start
for each chunk of 4 documents (parallel):
    fetch -> render -> write md -> write images -> update manifest in memory
    emit progress for chunk
    if batch_size(10) reached or done:
        save_manifest()
save_manifest()  // final save
```

## Impact

- `commands.rs`: 重构 `spawn_sync_progress` 中的串行循环为并行
- `sync.rs`: 新增 `sync_document_to_disk_v2` 不自动写 manifest，或修改现有函数签名
- `storage.rs`: 新增 `upsert_manifest_record_in_memory` 内存操作
- `model.rs`: 可能需要调整 `SyncWriteResult` 结构
