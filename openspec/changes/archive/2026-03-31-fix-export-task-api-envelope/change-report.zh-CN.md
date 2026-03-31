# 变更报告：fix-export-task-api-envelope

## 基本信息

- **变更名称**: fix-export-task-api-envelope
- **执行者**: 票据猫（接口锻造师）
- **日期**: 2026-03-31

## 变更动机

表格/多维表格等走导出任务链路的同步在创建导出任务阶段报错 `export_tasks missing ticket`，前端阶段归类为未知。对照飞书开放平台文档，成功响应体中 `ticket` 位于 `data.ticket`，查询结果位于 `data.result`；实现此前按根级字段解析，与标准信封不一致。

## 变更范围

- `src-tauri/src/mcp.rs`：新增 `parse_export_task_create_response`、`parse_export_task_status_result`；`create_export_task` / `get_export_task_status` 使用上述解析；补充单元测试。

## 规格影响

- 增量规格 `tauri-desktop-runtime-and-backend`：明确导出任务 API 须按 `code`/`msg`/`data` 信封解析。

## 任务完成情况

- OpenSpec proposal / design / specs / tasks 已完成并通过 `openspec validate`。
- 实现与 `cargo test`（相关用例）已通过。

## 验证

- `openspec validate fix-export-task-api-envelope --type change`
- `cargo test parses_export`、`cargo test export_task_create_nonzero`

## 备注

- 对根级 `ticket` / `result` 保留兼容读取，便于测试或非标网关；优先使用 `data` 内字段。
