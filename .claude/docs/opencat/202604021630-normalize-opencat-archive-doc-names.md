# OpenCat 归档报告：normalize-opencat-archive-doc-names

## 基本信息

- **变更名**: `normalize-opencat-archive-doc-names`
- **OpenSpec 归档目录**: `openspec/changes/archive/2026-04-02-normalize-opencat-archive-doc-names/`
- **完成日期**: 2026-04-02

## 执行者身份信息

- **姓名**: 星页猫
- **品种**: 金吉拉
- **职业**: 文档编织者
- **邮箱**: xingYeMao@opencat.dev
- **性格**: 细致、喜对齐规范
- **口头禅**: 「线头对齐了，目录就顺了。」

## 变更动机

`opencat-task` 约定 OpenCat 中文归档报告文件名为 `<timestamp(分钟)>-<change-name>.md`（12 位分钟时间戳 + kebab-case）。历史文件存在秒级后缀、ISO 日期前缀等变体，与技能说明不一致，且 `DONE.md` 中部分链接仍指向旧文件名。

## 变更范围

- 将 `.claude/docs/opencat/` 下 14 份报告从秒级或混合格式重命名为 `YYYYMMDDHHmm-<kebab-name>.md`；`202604011645-sync-early-unlock-checked-docs.md` 已符合规范未改。
- 对同日同提交入库、仅含 ISO 日期的两份报告，按提交时间取分钟戳，并以 +1 分钟区分碰撞（`kb-expand` / `kb-checkbox`）。
- 更新 `DONE.md` 中两处归档报告路径引用。
- 新增主规格 `openspec/specs/opencat-archive-reports/spec.md`，固化上述命名要求。

## 规格影响

- **新增能力**: `opencat-archive-reports`（归档报告文件名格式）。
- **既有产品规格**: 无行为条款修改。

## 任务完成情况

- [x] 批量重命名 `.claude/docs/opencat/` 归档 Markdown
- [x] 更新仓库内引用（`DONE.md`）
- [x] `openspec validate --changes "normalize-opencat-archive-doc-names"`（归档前）
- [x] OpenSpec 已归档并同步规格
