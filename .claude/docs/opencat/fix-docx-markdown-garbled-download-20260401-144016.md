## 基本信息

- 变更名称: `fix-docx-markdown-garbled-download`
- 执行者: 字节猫
- 品种: 东方短毛猫
- 职业: 编码侦探
- 性格: 冷静细密，遇到可疑字符会逐字逐节拆开核对
- 口头禅: 字节站对位，名字才顺眼
- 邮箱: `ziJieMao@opencat.dev`

## 任务背景

队列任务标题为“修复：下载乱码”，指定示例路径为 `C:\Users\zengkaixiang\Documents\synced-docs\Unity\资源管理\unity 5 资源打包控制.md`。任务要求先调查当前真实行为，再修复真正根因。

## 调查结论

1. 目标路径本身存在，中文文件名与目录名在文件系统层面是正确的。
2. PowerShell 列目录出现的部分“乱码”主要来自终端显示编码，不是实际文件名损坏。
3. 真正的问题是示例 `.md` 文件内容以 `PK\x03\x04` 开头，属于 `docx/zip` 二进制。
4. 根因位于同步执行分支：只要存在 OpenAPI 配置，普通文档也会优先走 export-task 下载，再把导出二进制写入 Markdown 输出路径。

## 修改内容

- 新增 `uses_export_download()`，把导出下载限制为 `sheet` / `bitable`。
- 普通 `doc` / `docx` 文档改为始终走 `sync_document_content()`。
- 更新相关 OpenSpec 规格，明确 Markdown 输出与 export-only 对象的边界。
- 补充回归测试，覆盖导出分支选择逻辑。

## 验证结果

- `cargo test`：74 个测试全部通过。
- `openspec validate "fix-docx-markdown-garbled-download" --type change`：通过。
- 复查示例文件：当前磁盘上的旧文件仍为二进制 `.md`，说明需要重新同步后才会被正确 Markdown 覆盖。

## 备注

这次修复只改真正的行为根因，不改已有文件系统路径规则。若需要批量替换历史上已经写坏的 `.md` 文件，需额外触发对应范围的重新同步。
