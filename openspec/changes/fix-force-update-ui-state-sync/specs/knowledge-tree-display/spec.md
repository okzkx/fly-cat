## MODIFIED Requirements

### Requirement: Bulk remote freshness refresh

The system MUST provide labeled controls on the knowledge base home card (same surface as **批量删除** and **开始同步**) for the **currently checked document/bitable leaves that already have sync status `synced`**:

- **全部刷新** refreshes remote document metadata for the checked synced leaves and keeps the existing conditional local-version alignment rule. It MUST NOT delete local files or start a sync task.
- **强制更新** MUST delete local on-disk outputs (exported document files and their recorded image assets) for the checked synced leaves, immediately refresh the in-memory manifest-backed sync status view so those stripped leaves render as `未同步`, refresh remote metadata, align local manifest-backed version metadata to the refreshed remote metadata with the forced rule, then start a sync task using the same effective selection as **开始同步** so the pipeline re-pulls from Feishu. If a sync task is already `pending` or `syncing`, **强制更新** MUST NOT start another task and MUST surface a clear error. If there is no effective sync selection, **强制更新** MUST still perform strip + metadata steps but MUST NOT create a sync task and MUST warn the user to choose a scope and use **开始同步**.

For each checked synced leaf whose primary exported file is Markdown (`.md`), **强制更新** MUST also remove a sibling directory under the same parent folder whose name equals that file’s stem (filename without extension) when that path exists and is a directory. This matches the wiki layout where child documents are written under `Title/` next to `Title.md`, so child outputs are cleared and the sync pipeline re-downloads them instead of skipping as unchanged.

Both controls MUST use the same batch freshness API and persistence flow as the automatic debounced freshness pass for the selected synced document ids. Both controls MUST be disabled when sync cannot run (no usable sync root or connection state disallows sync, matching existing **开始同步** gating) or when there are zero checked synced leaves. While either action is in progress, the triggering control MUST show a loading state and MUST NOT start overlapping refresh calls.

After **全部刷新** completes, the system MUST align the local version metadata for each selected synced document with the refreshed remote version metadata only when any of the following is true:

- the local version is lower than the remote version
- the local version is missing while the remote version exists
- the remote version is missing while the local version exists

After **强制更新** completes its metadata phase, the system MUST align the local version metadata for each selected synced document with the refreshed remote version metadata whenever the refresh succeeds, regardless of whether the local version is lower, higher, missing, or simply different.

When **强制更新** has already queued a replacement sync task for a non-empty effective selection, the Home page task summary and the task list MUST show that pending task immediately, without waiting for the freshness refresh/alignment phase to finish. Merely queuing that pending task MUST NOT overwrite the freshly stripped leaves back to a syncing badge before the replacement sync actually starts.

#### Scenario: User refreshes checked synced documents

- **WHEN** the user activates **全部刷新** and at least one checked leaf document has sync status `synced` and `canRunSync` is true
- **THEN** the system fetches remote freshness for the checked synced document ids, updates the in-memory freshness map, persists metadata, and updates manifest-backed local version state only for the selected synced documents that satisfy the normal alignment rule

#### Scenario: Force update clears synced badges immediately after strip

- **WHEN** the user runs **强制更新** for checked synced leaves and the local strip step succeeds
- **THEN** those leaves stop rendering as `已同步` immediately and instead render as `未同步` until a replacement sync actually starts for them

#### Scenario: Force update queues task before metadata refresh finishes

- **WHEN** the user runs **强制更新**, the local strip step succeeds, and there is a non-empty effective sync selection
- **THEN** the follow-up sync task appears in the Home page task summary and task list as a pending task before the shared freshness refresh/alignment phase finishes

#### Scenario: Force update strips local files and starts sync

- **WHEN** the user completes **强制更新** successfully, no sync task is `pending` or `syncing`, and the user has a non-empty effective sync selection
- **THEN** the system deletes local outputs for the checked synced documents, refreshes and persists metadata with forced manifest alignment, refreshes sync statuses, and creates and starts a sync task from the current effective selection

#### Scenario: Force update removes wiki child output directory next to Markdown parent

- **GIVEN** a checked synced wiki/Markdown document whose manifest `output_path` is `…/Parent.md` and a directory `…/Parent/` exists containing child-synced Markdown files
- **WHEN** the user runs **强制更新** for that document
- **THEN** the system removes `…/Parent.md`, recorded image assets for that document, and recursively removes `…/Parent/` so subsequent sync does not skip child documents solely because unchanged local files remain

#### Scenario: Force update blocked by active sync

- **WHEN** a sync task is already `pending` or `syncing`
- **THEN** **强制更新** is disabled

#### Scenario: Force update with no effective selection

- **WHEN** the user completes **强制更新** strip and metadata steps but `effectiveSelectedSources` is empty
- **THEN** the system does not create a sync task and warns the user

#### Scenario: No checked synced documents

- **WHEN** no checked leaf document has sync status `synced`
- **THEN** both **全部刷新** and **强制更新** are disabled

#### Scenario: Sync unavailable

- **WHEN** the connection or sync root is not usable for sync (same conditions under which **开始同步** is disabled for connectivity/root reasons)
- **THEN** both **全部刷新** and **强制更新** are disabled

#### Scenario: Per-row re-sync remains separate

- **WHEN** the user uses **全部刷新**
- **THEN** the system does not create a sync task or re-download bodies (full re-download remains **强制更新** or per-row re-sync)
