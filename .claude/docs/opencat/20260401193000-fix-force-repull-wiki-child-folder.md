# 变更报告：强制更新时清理 wiki 子文档目录

## 基本信息

- **变更名称**: fix-force-repull-wiki-child-folder
- **归档日期**: 2026-04-01
- **基础分支**: master

## 执行者身份

- **姓名**: 字节猫
- **品种**: 东方短毛猫
- **职业**: 编码侦探
- **性格**: 冷静细密，遇到可疑字符会逐字逐节拆开核对
- **口头禅**: 字节站对位，名字才顺眼
- **邮箱**: ziJieMao@opencat.dev

## 变更动机

用户勾选「带子文档」的 wiki/Markdown 文档并 **强制更新** 时，仅删除 `标题.md` 会留下同级目录 `标题/`，子文档 `.md` 仍在磁盘上；manifest 版本仍与远端一致，`is_document_unchanged` 将子文档判为未变更而跳过，表现为子文档未重新拉取。

## 变更范围

- `src-tauri/src/commands.rs`：`prepare_force_repulled_documents_impl` 在清理 `.md` 主文件与清单图片后，若存在与文件名（无扩展名）同名的子目录则 `remove_dir_all`；非 `.md` 导出行为不变。
- `openspec/specs/knowledge-tree-display/spec.md`：补充强制更新对 wiki 子目录的清理要求与场景。
- OpenSpec 变更已归档至 `openspec/changes/archive/2026-04-01-fix-force-repull-wiki-child-folder/`。

## 规格影响

- `knowledge-tree-display`：**强制更新** 对 Markdown 主文件需同时删除同名子目录（wiki 子树布局）。

## 任务完成情况

- Purpose / Apply / Archive 流程已完成。
- 验证：`cargo test --manifest-path src-tauri/Cargo.toml`（80 项）、`npm run typecheck`、`openspec validate fix-force-repull-wiki-child-folder --type change`（归档前）。

## 残余风险

- 若用户在同步根下与某 `.md` 主文件同名的目录中存放了非本工具生成的文件，强制更新该父文档时可能被一并删除；与飞书 wiki 落盘约定一致时风险可接受。
