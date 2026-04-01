## Context

`markdown_output_path` 将文档标题映射为 `…/父路径/标题.md`；子文档路径为 `…/父路径/标题/子标题.md`，即与 `标题.md` 同级的目录 `标题/` 承载子树。`prepare_force_repulled_documents_impl` 当前只 `remove_file` 主文件并清理 `image_assets`，再 `clean_empty_dirs`；只要 `标题/` 内仍有子文档文件，该目录不会被清空，子文档满足 `is_document_unchanged`（文件存在且版本一致）而被跳过。

## Goals

- 强制更新所选 **Markdown** 文档时，一并移除上述 wiki 子树目录，不改动非 `.md` 导出类型（如 xlsx）的行为。
- 最小实现：仅在主输出为 `.md` 且存在同名子目录时 `remove_dir_all`。

## Non-goals

- 不扫描 manifest 批量清除子 document_id 的版本字段（删除文件已足以让 `is_document_unchanged` 为 false）。
- 不删除与主文件不同名的其它并列目录。

## Risks

- 若用户在同步根下同名目录中手动放入非同步文件，可能被删除；该目录名与飞书 wiki 子树约定一致，风险可接受。
