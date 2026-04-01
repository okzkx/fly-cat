## 基本信息

- 变更名称: `fix-docx-markdown-garbled-download`
- 归档目录: `openspec/changes/archive/2026-04-01-fix-docx-markdown-garbled-download`
- 规格影响:
  - `knowledge-base-source-sync`
  - `mcp-markdown-content-pipeline`

## 变更动机

本次问题表面上像是“下载出来的 Markdown 文件乱码”，但实际复现显示：示例文件 `C:\Users\zengkaixiang\Documents\synced-docs\Unity\资源管理\unity 5 资源打包控制.md` 被写入了以 `PK\x03\x04` 开头的 `docx/zip` 二进制内容。也就是说，乱码并非中文文件名编码损坏，而是普通文档错误走了导出下载链路，并把二进制导出结果落到了 `.md` 路径。

## 变更范围

- 在 `src-tauri/src/commands.rs` 中新增导出分支选择辅助逻辑。
- 将 export-task 下载严格限制为 `sheet` / `bitable` 等导出型对象。
- 让普通 `doc` / `docx` 文档始终走结构化内容抓取 + Markdown 渲染链路。
- 补充针对导出分支选择的回归测试断言。

## 规格影响

- `mcp-markdown-content-pipeline` 现在明确要求：任何目标输出为 `.md` 的文档都必须来自 Markdown 渲染管线，不能直接写入导出二进制。
- `knowledge-base-source-sync` 现在明确要求：只有导出型对象继续使用 export 下载，普通文档必须使用 Markdown 内容管线。

## 任务完成情况

- 已复现当前真实行为，并确认示例 `.md` 文件内容是二进制导出包而不是文本 Markdown。
- 已完成分支选择修复，并保留 `sheet` / `bitable` 导出行为。
- 已通过 `cargo test` 与 `openspec validate` 验证修改。
- 说明: 已存在于磁盘上的坏 `.md` 文件不会被自动原地修复，用户需重新同步对应文档或目录以生成正确 Markdown。
