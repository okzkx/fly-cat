# DONE

- [2026-03-29 20:10] #1 知识库目录同步完文档默认打勾，可取消打勾删除 — 已同步文档默认勾选，可取消打勾标记删除；点击开始同步时自动清理未勾选文档；同步中/等待中文档checkbox禁用。Rust后端新增remove_synced_documents命令，前端通过uncheckedSyncedDocKeys追踪状态，经三检查点提交合并到master。
- [2026-03-29 22:00] #2 知识库目录多选框与文档名字点击同步 — handleSelect改为toggle模式（点击已选中项自动取消勾选），点击文档名字和多选框行为完全一致，uncheckedSyncedDocKeys在handleSelect中同步更新。经propose→apply→archive三阶段完成。
- [2026-03-29 22:15] #3 配置页面转向知识库目录页面卡住修复 — get_app_bootstrap改为异步函数，前端回调先执行页面切换再异步加载bootstrap数据，实现非阻塞页面切换。经opencat-task完整流程完成。
- [2026-03-29 22:35] #4 知识库目录三态复选框 — 移除Tree组件checkStrictly属性，启用Ant Design原生父子关联，当部分子节点选中时父节点显示减号（indeterminate）状态。经opencat-task完整流程完成。
- [2026-03-29 19:20] #5 端口占用问题修复（初步） — 将 vite.config.ts 中 strictPort 从 true 改为 false，当应用被强制关闭后再次启动时，Vite 会自动尝试下一个可用端口。
- [2026-03-30 00:40] #6 端口占用问题修复（彻底） — 双层防御：启动时自动检测并清理孤儿 Node.js 进程（findPortOwnerPid + isNodeProcess + killOrphanedDevProcesses），仅杀死 node.exe 进程避免误杀；配合 strictPort:false 兜底。全部56项测试通过（含13项新增）。
- [2026-03-30 01:00] #7 修复编译时的 Rust warning — 消除13个编译警告至零。commands.rs 加 #[cfg(test)] 和 #[allow(dead_code)]，sync.rs 同理，mcp.rs 补充字段注解。cargo check 和 cargo test（29项）均无 warning 通过。
- [2026-03-30 01:20] #8 知识库文档三态复选框行为优化 — 实现精确三态循环切换：勾选（自身+子文档全选）→ 方块（保持子文档当前状态）→ 取消（全部取消勾选）。全选/全不选时仅两态切换。新增 treeSelection.ts 工具函数和15项单元测试，HomePage.tsx 使用 checkStrictly + 手动 halfChecked 计算。全部21项测试通过。
- [2026-03-30 01:50] #9 文档新鲜度检查（元数据记录） — Rust 后端新增 DocumentFreshnessResult 模型和 check_document_freshness 命令，对比 manifest 中的版本/更新时间与飞书 API 返回值，返回 current/updated/new/error 四种状态。前端新增 TypeScript 类型定义。cargo check 和 cargo test（29项）均通过。
- [2026-03-29 22:40] #10 文档新鲜度持久化存储与前端显示 — SQLite 数据库(.freshness-metadata.db)存储新鲜度元数据； 新增 load_freshness_metadata/save_freshness_metadata/clear_freshness_metadata 命令; 前端 HomePage 在已同步文档后显示新鲜度状态图标(绿色对勾/黄色感叹号/蓝色同步/红色错误)。 经 opencat-task 完整 worktree 流程完成。
