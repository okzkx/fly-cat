## 1. Rust 后端异步化

- [ ] 1.1 将 `get_app_bootstrap` 函数签名从 `pub fn` 改为 `pub async fn`，使用 `tokio::task::spawn_blocking` 包裹现有同步逻辑
- [ ] 1.2 确认 `Cargo.toml` 已包含 `tokio` 依赖（Tauri 2.x 默认已含）

## 2. 前端页面切换优化

- [ ] 2.1 调整 `onAuthorized` 回调：先执行 `setAuthed(true)`、`setUserInfo()`、`setCurrentPage("home")`，再以 fire-and-forget 方式调用 `getAppBootstrap()` 补充 `resolvedSyncRoot`
- [ ] 2.2 调整 `onSaved` 回调：先执行 `setCurrentPage("auth")` 和状态重置，再以 fire-and-forget 方式调用 `getAppBootstrap()` 补充 `resolvedSyncRoot`

## 3. 验证

- [ ] 3.1 确认应用启动、设置保存后切换到登录页、登录成功后切换到知识库目录页均无 UI 冻结
