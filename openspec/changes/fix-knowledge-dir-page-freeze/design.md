## Context

Tauri 2.x 的同步命令（`fn`）默认在主线程执行。当前 `get_app_bootstrap` 是同步命令，内部调用 `resolve_connection_check` 进行飞书 API 网络请求（`client.list_spaces()`），阻塞主线程导致 UI 冻结。问题出现在两个场景：

1. **设置页保存后**: `onSaved` 回调先 `saveAppSettings` 再 `await getAppBootstrap()`，后者阻塞 UI 直到网络返回
2. **登录成功后**: `onAuthorized` 回调先更新状态再 `await getAppBootstrap()` 补充 `resolvedSyncRoot`，阻塞页面切换

现有 spec `Non-Blocking Tree and Task Commands` 已要求 tree-loading 和 task-creation 命令异步化，但 `get_app_bootstrap` 不在其覆盖范围内。

## Goals / Non-Goals

**Goals:**
- `get_app_bootstrap` Rust 命令改为 async，网络 I/O 在 Tauri 异步线程池执行
- 前端页面切换在 bootstrap 数据返回之前完成，UI 不冻结
- 保持现有功能行为不变

**Non-Goals:**
- 不改变 `complete_user_authorization` 的同步/异步状态（登录回调流程本身就是异步的）
- 不重构 bootstrap 数据结构或页面路由逻辑
- 不改变 `resolve_connection_check` 内部逻辑

## Decisions

### Decision 1: 将 `get_app_bootstrap` 改为 `pub async fn`

**选择**: 添加 `async` 关键字并 `tokio::spawn_blocking` 包裹同步网络调用。

**替代方案**:
- (a) 将 `resolve_connection_check` 改为 async 并使用 reqwest 异步客户端 — 改动面过大，涉及整个 HTTP 客户端层
- (b) 使用 `tokio::task::spawn_blocking` 在阻塞线程池执行现有同步代码 — 最小改动，无需重构 HTTP 客户端

**理由**: 方案 (b) 改动最小（仅加一个 `spawn_blocking` wrapper），不引入新的异步依赖，且 `get_app_bootstrap` 本身只在应用启动和页面切换时调用，不需要高并发。

### Decision 2: 前端先切换页面再异步补充 bootstrap 数据

**选择**: 在 `onAuthorized` 和 `onSaved` 回调中，先执行 `setCurrentPage()` 和必要的用户状态更新，再以 fire-and-forget 方式调用 `getAppBootstrap()` 补充次要数据（如 `resolvedSyncRoot`）。

**理由**: `onAuthorized` 已从 `completeUserAuthorization` 获得了用户信息、spaces 和 connectionValidation，这些足以渲染目标页面。`getAppBootstrap()` 的额外价值主要是 `resolvedSyncRoot`，可以在页面显示后异步补充。同理 `onSaved` 的目标页面是 auth 页面，只需要重置状态即可，`resolvedSyncRoot` 可以稍后补充。

## Risks / Trade-offs

- **`resolvedSyncRoot` 延迟到达**: 页面切换后 `syncTarget` 可能短暂为 `null`，但 HomePage 已有 `resolvedSyncRoot ?? settings?.syncRoot ?? "./synced-docs"` 的 fallback 链，不会导致错误
- **竞态**: 快速连续切换页面可能导致多次 `getAppBootstrap` 调用重叠，但由于只是读取操作，最终结果一致，无副作用
