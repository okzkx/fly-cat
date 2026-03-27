# skill-driven-archive-reporting Specification

## Purpose
TBD - created by archiving change skill-chinese-archive-report. Update Purpose after archive.
## Requirements
### Requirement: Skill-Driven Chinese Archive Report
The repository workflow MUST allow `openspec-all-in-one` to produce a Chinese Markdown archive report after a change is archived, without requiring modifications to OpenSpec CLI/source code.

#### Scenario: Archive succeeds through skill workflow
- **WHEN** `openspec-all-in-one` archives a completed change
- **THEN** the workflow writes `change-report.zh-CN.md` into the archived change directory using information from archived artifacts already present there

### Requirement: Archive Report Has Minimal Reader-Facing Summary
The Chinese archive report MUST include a concise reader-facing summary of the archived change.

#### Scenario: Report is generated
- **WHEN** the skill generates `change-report.zh-CN.md` after archive
- **THEN** the report includes basic info, motivation summary, scope summary, spec impact summary, and task completion summary

