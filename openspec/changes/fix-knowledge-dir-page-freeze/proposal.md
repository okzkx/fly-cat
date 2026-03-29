## Why

从配置页面保存设置后转向登录页、以及登录成功后转向知识库目录页面时，界面会明显卡住。原因是 Rust 后端 `get_app_bootstrap` 命令是同步函数（`fn` 而非 `async fn`），内部调用了飞书 API 查询知识空间列表（`client.list_spaces()`），阻塞了 Tauri 主线程导致 UI 无响应。

## What Changes

- 将 Rust 后端 `get_app_bootstrap` 从同步 `fn` 改为 `async fn`，使其在 Tauri 的异步线程池中执行网络 I/O，不再阻塞 UI 主线程。
- 调整前端 `App.tsx` 中 `onAuthorized` 回调，先执行页面切换到 `"home"`，再异步调用 `getAppBootstrap()` 补充 `resolvedSyncRoot` 等数据，避免页面切换等待网络返回。
- 调整前端 `App.tsx` 中 `onSaved` 回调，同理先切换到 `"auth"` 页面再异步补充 bootstrap 数据。

## Capabilities

### New Capabilities

（无新能力）

### Modified Capabilities

- `tauri-desktop-runtime-and-backend`: `get_app_bootstrap` 命令从同步改为异步，解除 UI 主线程阻塞
- `sync-focused-application-experience`: 页面切换不再等待 bootstrap 网络调用完成，优化从配置页到知识库目录页的过渡流畅度

## Impact

- **Rust 后端** (`src-tauri/src/commands.rs`): `get_app_bootstrap` 函数签名从 `pub fn` 改为 `pub async fn`
- **前端** (`src/App.tsx`): `onAuthorized` 和 `onSaved` 回调中页面切换与 bootstrap 数据加载的执行顺序调整
- **不影响**现有功能行为，仅改善响应时序
