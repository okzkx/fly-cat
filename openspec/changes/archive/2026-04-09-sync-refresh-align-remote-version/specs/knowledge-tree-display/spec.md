## MODIFIED Requirements

### Requirement: Bulk remote freshness refresh

The system MUST provide labeled controls on the knowledge base home card (same surface as **批量删除** and **开始同步**) for the **currently checked document/bitable leaves that already have sync status `synced`**:

- **全部刷新** MUST fetch remote document metadata for the checked synced leaves using the batch freshness API, update the in-memory freshness map, persist freshness metadata, then align manifest-backed local `version` and `update_time` to the refreshed remote values using the forced alignment rule (the same rule **强制更新** uses after metadata refresh: whenever the check succeeds and local fields differ from remote). It MUST NOT delete local exported files or image assets, MUST NOT call prepare-for-repull or strip helpers, and MUST NOT create, queue, or start a sync task.
- **强制更新** MUST delete local on-disk outputs (exported document files and their recorded image assets) for the checked synced leaves, immediately refresh the in-memory manifest-backed sync status view so those stripped leaves render as `未同步`, refresh remote metadata, align local manifest-backed version metadata to the refreshed remote metadata with the forced rule, then start a sync task using the same effective selection as **开始同步** so the pipeline re-pulls from Feishu. If a sync task is already `pending` or `syncing`, **强制更新** MUST NOT start another task and MUST surface a clear error. If there is no effective sync selection, **强制更新** MUST still perform strip + metadata steps but MUST NOT create a sync task and MUST warn the user to choose a scope and use **开始同步**.

For each checked synced leaf whose primary exported file is Markdown (`.md`), **强制更新** MUST also remove a sibling directory under the same parent folder whose name equals that file’s stem (filename without extension) when that path exists and is a directory. This matches the wiki layout where child documents are written under `Title/` next to `Title.md`, so child outputs are cleared and the sync pipeline re-downloads them instead of skipping as unchanged.

Both controls MUST use the same batch freshness API and persistence flow as the automatic debounced freshness pass for the selected synced document ids. Both controls MUST be disabled when sync cannot run (no usable sync root or connection state disallows sync, matching existing **开始同步** gating) or when there are zero checked synced leaves. While either action is in progress, the triggering control MUST show a loading state and MUST NOT start overlapping refresh calls.

The checked synced document id set used by **全部刷新**, **强制更新**, and **批量删除** MUST be the union of: (1) document ids collected from loaded knowledge-base tree nodes using the expanded checkbox key set, and (2) `documentId` values from `selectedSources` entries whose kind is `document` or `bitable`, limited to ids that are manifest-backed `synced` and not excluded by the same active-sync rules that gate the bulk controls. The union MUST be deduplicated.

After **强制更新** completes its metadata phase, the system MUST align the local version metadata for each selected synced document with the refreshed remote version metadata whenever the refresh succeeds, regardless of whether the local version is lower, higher, missing, or simply different.

When **强制更新** has already queued a replacement sync task for a non-empty effective selection, the Home page task summary and the task list MUST show that pending task immediately, without waiting for the freshness refresh/alignment phase to finish. Merely queuing that pending task MUST NOT overwrite the freshly stripped leaves back to a syncing badge before the replacement sync actually starts.

#### Scenario: User refreshes checked synced documents

- **WHEN** the user activates **全部刷新** and at least one checked leaf document has sync status `synced` and `canRunSync` is true
- **THEN** the system fetches remote freshness for the checked synced document ids, persists freshness metadata, applies forced manifest alignment to match remote for successful checks, reloads sync statuses, and does not delete local outputs or start a sync task

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

#### Scenario: Batch-checked synced leaves enable toolbar when tree id collection is incomplete

- **WHEN** the user has checked one or more **document** or **bitable** leaves with sync status `synced` such that those leaves appear in `selectedSources`
- **AND** `canRunSync` is true and bulk controls are not disabled by an active `pending` or `syncing` task
- **THEN** **全部刷新** and **强制更新** MUST be enabled if the merged checked synced id set (tree-derived ∪ explicit `selectedSources` leaf ids) is non-empty

## ADDED Requirements

### Requirement: Default sync task only downloads unsynced document bodies

The **开始同步** primary action (creating and starting a sync task from the current effective selection) MUST cause the sync pipeline to perform export/download work only for documents that are not classified as unchanged: same `document_id`, successful manifest row, matching `source_path`, expected `output_path`, and an existing primary output file. Documents that satisfy that unchanged classification MUST be skipped. For skipped documents, the pipeline MUST NOT update manifest `version` or `update_time` solely to reconcile remote metadata drift (those documents remain eligible for separate **全部刷新** handling).

#### Scenario: Unchanged synced documents are skipped without manifest drift repair

- **WHEN** a sync task runs after **开始同步** and discovery includes a document that already has local outputs consistent with the manifest unchanged check
- **THEN** that document is not queued for download/export and its manifest record is not rewritten only to match remote revision metadata
