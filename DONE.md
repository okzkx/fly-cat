# DONE

- [2026-03-29 20:10] #1 知识库目录同步完文档默认打勾，可取消打勾删除 — 已同步文档默认勾选，可取消打勾标记删除；点击开始同步时自动清理未勾选文档；同步中/等待中文档checkbox禁用。Rust后端新增remove_synced_documents命令，前端通过uncheckedSyncedDocKeys追踪状态，经三检查点提交合并到master。
- [2026-03-29 22:00] #2 知识库目录多选框与文档名字点击同步 — handleSelect改为toggle模式（点击已选中项自动取消勾选），点击文档名字和多选框行为完全一致，uncheckedSyncedDocKeys在handleSelect中同步更新。经propose→apply→archive三阶段完成。
- [2026-03-29 22:15] #3 配置页面转向知识库目录页面卡住修复 — get_app_bootstrap改为异步函数，前端回调先执行页面切换再异步加载bootstrap数据，实现非阻塞页面切换。经opencat-work完整流程完成。
- [2026-03-29 22:35] #4 知识库目录三态复选框 — 移除Tree组件checkStrictly属性，启用Ant Design原生父子关联，当部分子节点选中时父节点显示减号（indeterminate）状态。经opencat-work完整流程完成。
- [2026-03-29 19:20] #5 端口占用问题修复 — 将 vite.config.ts 中 strictPort 从 true 改为 false，当应用被强制关闭后再次启动时，Vite 会自动尝试下一个可用端口。
