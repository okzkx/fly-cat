# 变更归档报告：fix-sheet-export-path-space-folder

## 基本信息

- **变更名称**: `fix-sheet-export-path-space-folder`
- **归档目录**: `openspec/changes/archive/2026-04-13-fix-sheet-export-path-space-folder/`
- **执行日期**: 2026-04-13

## 执行者身份

- **展示名 / Git user.name**: 字节猫
- **Git user.email**: ziJieMao@opencat.dev
- **品种**: 东方短毛猫
- **角色**: 编码侦探
- **经验摘要**: 字节猫是 OpenCat 团队的编码侦探，擅长从路径拼接与编码细节追溯根因。
- **性格**: 冷静细密，遇到可疑字符会逐字核对
- **口头禅**: 字节站对位，名字才顺眼

## 变更动机

同步飞书表格（`sheet` / `bitable`）导出为 `.xlsx` 时，后端 `expected_output_path` 未像 Markdown 一样先进入「知识库（空间）」这一级目录，文件落在同步根下的「父级」路径；前端 `mapDocumentPath` 与浏览器打开链接仍按含空间名的完整路径构造 URL，导致页面报「文件不存在」。

## 变更范围

- `src-tauri/src/sync.rs`：`sheet` / `bitable` 分支改为基于 `markdown_output_path` 再 `set_extension` 为导出扩展名，与 Markdown 与前端路径规则一致。
- 单元测试：更新导出路径期望，包含 `产品知识库` 目录段。
- OpenSpec：`mcp-markdown-content-pipeline` 规格增加「导出路径与 Markdown 布局对齐」场景；变更已归档并回写主规格。

## 规格影响

- `openspec/specs/mcp-markdown-content-pipeline/spec.md`：在「Stable Local File Mapping」下新增导出路径与 Markdown 对齐场景。

## 任务完成情况

- Purpose / Apply / Archive 三阶段提交均已完成。
- `cargo test`（`src-tauri`）全部通过。
- 未执行 `/opencat-auto-test`：本修复为 Tauri 后端路径逻辑，无独立可访问的 Web 冒烟 URL；回归由 `cargo test` 覆盖。

## 备注

- 已同步文件的 manifest 若仍记录旧路径，重新同步后会写入新路径并可能清理旧位置文件。
