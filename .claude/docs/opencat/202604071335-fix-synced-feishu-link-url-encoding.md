# OpenCat 任务归档：修复飞书同步外链百分号编码

## 基本信息

- **变更名称（change-name）**：`fix-synced-feishu-link-url-encoding`
- **任务分支**：`opencat/fix-synced-feishu-link-url-encoding`
- **执行模式**：worktree（槽位 `F:/okzkx/feishu_docs_sync-worktree`，闲置分支 `opencat/idle/feishu_docs_sync-worktree`）
- **主干**：`master`
- **OpenSpec 归档目录**：`openspec/changes/archive/2026-04-07-fix-synced-feishu-link-url-encoding/`

## 执行者信息

- **展示名 / Git `user.name`**：字节猫
- **Git `user.email`**：ziJieMao@opencat.dev
- **品种**：东方短毛猫
- **角色**：编码侦探
- **性格**：冷静细密，遇到可疑字符会逐字逐节拆开核对
- **口头禅**：字节站对位，名字才顺眼
- **Agent 档案**：`C:/Users/zengkaixiang/.claude/agents/opencat/字节猫.md`

## 变更动机

用户反馈从飞书同步到本地的 Markdown 中，部分绝对链接被写成整段百分号编码（例如 `https%3A%2F%2F...`），浏览器与常见 Markdown 工具无法将其识别为正常的 `https://` 链接。根因是 Feishu `text_run` 的 `link.url` 字段在部分场景下返回已编码的整串 URL，管道此前原样写入 `[text](url)`。

## 变更范围

- **代码**：`src-tauri/src/mcp.rs` — 在 `extract_text_from_elements` 解析链接时增加 `normalize_feishu_hyperlink_url`：若原始串并非以 `http://` / `https://` 开头、但经 `urlencoding::decode` 后得到标准绝对 URL，则采用解码结果；已为规范 `http`/`https` 的字符串保持不变，避免破坏路径或查询串中合法的 `%` 转义。
- **测试**：同文件新增 `decodes_percent_encoded_https_link_url`、`preserves_https_url_with_percent_in_path`。
- **规格**：`openspec/specs/mcp-markdown-content-pipeline/spec.md` 增加「Decoded external hyperlink targets in Markdown」需求（由 `openspec archive` 合并）。

## 规格影响

- 行为要求已写入主规格 `mcp-markdown-content-pipeline`，明确百分号编码的 `https` 外链须解码后写入 Markdown。

## 任务完成情况

- Purpose / propose：已提交 `[propose] fix-synced-feishu-link-url-encoding: ...`
- Apply：已实现并提交 `[apply] fix-synced-feishu-link-url-encoding: ...`
- 验证：`cargo test mcp::` 通过（含新增用例）
- Archive：`openspec archive fix-synced-feishu-link-url-encoding -y` 已成功，变更已迁入 `openspec/changes/archive/2026-04-07-fix-synced-feishu-link-url-encoding/`

## 残留风险与后续说明

- 仅对解码后以 `http://` 或 `https://` 开头的结果进行替换；其他 scheme（如 `mailto:`）若也以编码形式出现，当前版本刻意不处理，以免误伤。
- 未跑全量前端 `npm test`，本修复位于 Rust 同步与 Markdown 生成路径；若未来存在第二条 TS 侧富文本链接管道，需单独核对是否也要对齐逻辑。
