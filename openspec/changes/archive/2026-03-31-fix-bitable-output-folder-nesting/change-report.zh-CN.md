## 基本信息

- 变更名称：`fix-bitable-output-folder-nesting`
- 变更类型：缺陷修复
- 影响范围：Tauri/Rust 同步后端、OpenSpec 主规格与归档记录

## 变更动机

知识库中的多维表格/表格导出为 `.xlsx` 时，现有路径规则把表格标题同时当作目录名和文件名，导致输出结果变成“同名文件夹里再套一个同名表格”。这与用户预期的“直接得到表格文件”不一致，也会让本地路径映射显得不稳定。

## 变更范围

- 修正 `src-tauri/src/sync.rs` 中 export-only 文档的输出路径规则，只保留父级路径段作为目录。
- 保持 `bitable` / `sheet` 的导出扩展名与 manifest 路径比较逻辑不变。
- 新增 Rust 回归测试，覆盖嵌套表格不再生成重复同名目录的路径行为。
- 同步更新 `openspec/specs/mcp-markdown-content-pipeline/spec.md` 与归档 change 的 delta spec。

## 规格影响

- `mcp-markdown-content-pipeline` 的 Stable Local File Mapping 要求已补充 export-only 表格文件的路径约束。
- 明确 `bitable` / `sheet` 必须输出为 `.../<parent dirs>/<title>.xlsx`，不能落成 `.../<title>/<title>.xlsx`。

## 任务完成情况

- [x] 更新 export-only 输出路径生成逻辑
- [x] 补充回归测试覆盖重复目录问题
- [x] 运行 Rust 后端测试并通过
- [x] 重新验证 OpenSpec change
