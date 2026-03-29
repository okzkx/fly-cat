# Tasks: feishu_docs_export

## Tasks

- [ ] 1. 移除 commands.rs 中的固定 400ms sleep 延迟
- [ ] 2. 在 storage.rs 新增 `upsert_manifest_record_in_memory` 内存操作函数
- [ ] 3. 修改 sync.rs `sync_document_to_disk` 支持不写 manifest 模式，或拆分为纯处理函数
- [ ] 4. 重构 commands.rs `spawn_sync_progress`：使用 `std::thread::scope` 实现 concurrency=4 并行处理
- [ ] 5. 实现批量 manifest 写入逻辑（每 10 个文档或完成时写磁盘）
- [ ] 6. 验证进度事件仍然正常触发、错误正确记录
- [ ] 7. 运行 cargo check / cargo test 确认编译和测试通过
