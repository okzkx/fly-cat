# Document Freshness Persistence

## Why

当前 `check_document_freshness` 命令每次调用都需要实时查询飞书 API 来检查文档是否是最新版本，导致：
1. **性能问题**：每次加载页面都要等待 API 响应
2. **无法离线使用**：没有网络时无法显示新鲜度状态
3. **重复请求**：同一文档多次检查浪费 API 配额

## What

将文档新鲜度检查结果持久化到本地 SQLite 数据库，并在前端知识库目录中显示每个已同步文档的新鲜度状态。

### 核心功能
1. **SQLite 持久化存储**：创建 `.freshness-metadata.db` 存储新鲜度元数据
2. **CRUD 命令**：`load_freshness_metadata`、`save_freshness_metadata`、`clear_freshness_metadata`
3. **前端新鲜度指示器**：在已同步文档后显示状态图标

### 新鲜度状态
- `current` 🟢 文档已是最新版本
- `updated` ⚠️ 远程有更新
- `new` 🔵 远程新增文档
- `error` 🔴 检查失败

## Capabilities

### New Capabilities
- `document-freshness-persistence`: 持久化存储文档新鲜度元数据到 SQLite 数据库

### Modified Capabilities
- `synced-doc-checkbox`: 在已同步文档行显示新鲜度状态指示器

## Impact

### 后端 (Rust/Tauri)
- `src-tauri/src/storage.rs`: 新增 SQLite 数据库操作函数
- `src-tauri/src/commands.rs`: 新增 3 个 Tauri 命令
- `src-tauri/Cargo.toml`: 添加 `rusqlite` 依赖

### 前端 (React/TypeScript)
- `src/components/HomePage.tsx`: 添加 `FreshnessIndicator` 组件
- `src/utils/tauriRuntime.ts`: 添加新鲜度相关 API 调用函数
- `src/types/sync.ts`: 已有 `DocumentFreshnessResult` 类型定义

### 数据存储
- 位置：`{sync_root}/.freshness-metadata.db`
- 表：`freshness_metadata`
- 字段：`document_id`, `status`, `local_version`, `remote_version`, `local_update_time`, `remote_update_time`, `last_checked_at`, `error_message`
