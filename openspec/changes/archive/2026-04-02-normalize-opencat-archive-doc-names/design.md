## Context

`.claude/docs/opencat/` 中历史归档报告文件名混用 `YYYYMMDDHHmmss`、带 `-` 的 ISO 日期段、以及 `YYYYMMDD-HHMMSS` 等变体，与 `opencat-task` 技能约定的「分钟级时间戳 + kebab-case 变更名」不一致。

## Goals / Non-Goals

**Goals:**

- 统一为 `YYYYMMDDHHmm-<kebab-change-name>.md`。
- 在无损信息的前提下，将原 14 位「日期+时分秒」收敛为 12 位「日期+时分」（秒位丢弃）。
- 对 `2026-MM-DD-...` 形式，用首次进入仓库的提交时间推导分钟戳；同一提交内的多个文件以分钟 +1 区分，避免碰撞。

**Non-Goals:**

- 不修改各报告正文语义（除路径自引用外）。
- 不调整 OpenSpec 归档目录命名（`openspec/changes/archive/...` 保持不变）。

## Decisions

1. **时间戳来源**：已有 14 位且末两位为秒者，截取前 12 位；`20260401-144016` 类解析为 `202604011440`；仅含 ISO 日期的文件使用 `git log -1 --format=%ci` 得到本地时间的 `YYYYMMDDHHmm`，若同分钟冲突则第二个文件 `+1` 分钟。
2. **变更名后缀**：保持文件名中原有 kebab 段不变，与历史 OpenSpec change 名一致，避免与 `openspec/changes/archive/` 目录名对不上。
3. **引用**：全仓检索 `docs/opencat` 与旧 basename，更新为新模式。

## Risks / Trade-offs

- 外部书签或站外引用旧 URL/路径会失效 → 接受范围仅限仓库内一致性；可在 `DONE.md` 中反映新路径。
