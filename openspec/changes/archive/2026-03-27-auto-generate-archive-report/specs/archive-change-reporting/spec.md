## ADDED Requirements

### Requirement: Archived Change Includes Chinese Summary Report
The repository MUST generate a Chinese Markdown summary report inside the archived change directory whenever a change is archived through the repository-supported archive workflow.

#### Scenario: Archive workflow completes successfully
- **WHEN** a supported archive workflow archives a completed change
- **THEN** the archive directory contains a generated `change-report.zh-CN.md` file for that change

### Requirement: Archived Report Summarizes Core Change Context
The generated Chinese archive report MUST summarize the archived change using information derived from the archived proposal, design, specs, and tasks artifacts.

#### Scenario: Archived report includes key sections
- **WHEN** a generated archive report is created
- **THEN** it includes the change identity, motivation summary, change scope summary, affected specs summary, and task completion summary derived from the archived artifacts

### Requirement: Existing Archives Can Be Backfilled
The repository MUST provide a supported way to generate the Chinese archive report for an already archived change without re-running the archive operation.

#### Scenario: Backfill report for existing archive
- **WHEN** a developer targets an existing archived change directory that does not yet have `change-report.zh-CN.md`
- **THEN** the repository can generate that report in place from the archived artifacts alone
