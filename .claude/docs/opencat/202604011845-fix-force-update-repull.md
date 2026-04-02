# 变更报告：强制更新删除本地并触发同步拉取

## 基本信息

- **变更名称**: fix-force-update-repull
- **归档日期**: 2026-04-01
- **基础分支**: master

## 执行者身份

- **姓名**: 扫帚猫
- **品种**: 布偶猫
- **职业**: 交互设计师
- **性格**: 细致稳妥，偏爱清爽直接的交互
- **口头禅**: 先把界面扫干净，再让操作顺爪
- **邮箱**: saozhoumao@opencat.dev

## 变更动机

队列任务要求 **强制更新** 在任意本地/远端版本对比下都应「删掉本地后对远端来一次拉取」。原先实现只做元数据强制对齐，不删文件、不创建同步任务，用户感知上「强制」无效。

## 变更范围

- `src-tauri/src/commands.rs`：新增 `prepare_force_repulled_documents` / `prepare_force_repulled_documents_impl`；`is_document_unchanged` 要求输出文件存在才视为未变更；补充单测。
- `src-tauri/src/lib.rs`：注册命令。
- `src/utils/tauriRuntime.ts`、`taskManager.ts`：前端 invoke 封装。
- `src/components/HomePage.tsx`：强制更新流程为 strip → 批量新鲜度 → 强制对齐 → 刷新状态 → `onCreateTask`；有进行中同步任务时禁用；无有效同步范围时告警。
- `openspec/specs/knowledge-tree-display/spec.md`：与归档 delta 一致。

## 规格影响

- `knowledge-tree-display`：**强制更新** 含删本地导出与图片资源、保留 manifest 行、随后走与 **开始同步** 相同的有效选区创建任务；**全部刷新** 仍为纯元数据。

## 任务完成情况

- Purpose / Apply / Archive 流程已完成。
- 验证：`npm run typecheck`
- 验证：`cargo test --manifest-path src-tauri/Cargo.toml`（79 tests）

## 残余风险

- 同步任务仍按当前有效选区发现文档；仅勾选文档被 strip，其余文档行为不变。
- 浏览器模拟运行时 strip 为 no-op，依赖既有 mock 行为。
