# 变更归档报告 - fix-knowledge-dir-page-freeze

## 基本信息

- **变更名称**: fix-knowledge-dir-page-freeze
- **归档路径**: openspec/changes/archive/2026-03-29-fix-knowledge-dir-page-freeze/

## 变更动机

从配置页面保存设置后转向登录页、以及登录成功后转向知识库目录页面时，界面会明显卡住。原因是 Rust 后端 `get_app_bootstrap` 命令是同步函数，内部调用了飞书 API 查询知识空间列表,阻塞了 Tauri 主线程导致 UI 无响应。

## 变更范围

### 修改的文件

- `src-tauri/src/commands.rs`: `get_app_bootstrap` 函数签名从 `pub fn` 改为 `pub async fn`
- `src/App.tsx`: `onAuthorized` 和 `onSaved` 回调中页面切换与 bootstrap 数据加载的执行顺序调整

### 修改的能力

- `tauri-desktop-runtime-and-backend`: `get_app_bootstrap` 命令从同步改为异步,解除 UI 主线程阻塞
- `sync-focused-application-experience`: 页面切换不再等待 bootstrap 网络调用完成,优化从配置页到知识库目录页的过渡流畅度

## 规格影响

### tauri-desktop-runtime-and-backend

在 "Non-Blocking Tree and Task Commands" 需求中新增了 "App bootstrap does not freeze the UI" 场景:
要求中更新为：
> The application MUST execute tree-loading and sync-task-creation Tauri commands asynchronously so the UI thread remains responsive during Feishu API calls. The `get_app_bootstrap` command MUST also execute asynchronously so that bootstrap-time network calls do not block the UI thread.

### sync-focused-application-experience

新增 "Non-Blocking Page Transitions After Bootstrap Calls" 需求:
要求新增了两个场景:
- 保存设置时先切换到登录页面,加载 bootstrap 数据
- 授权成功时先切换到主页,加载 bootstrap 数据

## 任务完成情况

- [x] 1.1 Rust 后端异步化 - 将 `get_app_bootstrap` 改为 `async fn`
- [x] 1.2 确认 tokio 依赖
- [x] 2.1 onAuthorized 回调先切换页面,再异步加载 bootstrap
- [x] 2.2 onSaved 回调先切换页面再异步加载 bootstrap
- [ ] 3.1 集成验证（需用户手动测试）
