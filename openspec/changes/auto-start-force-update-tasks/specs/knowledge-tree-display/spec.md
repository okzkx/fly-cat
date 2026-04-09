## ADDED Requirements

### Requirement: Force-update replacement tasks auto-start
When **强制更新** creates a replacement sync task for a non-empty effective selection, the system MUST automatically move that pending task onto the same resume/start path that the task list uses for manual recovery. A successful force-update flow MUST NOT require the user to click **开始等待任务** or the row-level pending-task start control just to begin the replacement sync.

#### Scenario: Force-update success resumes the queued replacement task automatically
- **WHEN** the user completes **强制更新** successfully and the flow already queued a replacement task for the current effective selection
- **THEN** the application automatically resumes that pending task without requiring any additional user action in the task list

#### Scenario: Manual resume controls remain available for recovery
- **WHEN** a pending sync task still exists later because the app was interrupted or the automatic follow-up path did not complete
- **THEN** the task list still exposes manual resume controls for recovery
