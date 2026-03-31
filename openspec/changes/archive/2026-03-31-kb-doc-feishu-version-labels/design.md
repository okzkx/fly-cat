## Context

Manifest records already store `version` (Feishu revision at last successful/failed sync). Freshness checks persist `local_version` / `remote_version` in `.freshness-metadata.db` and the UI loads them into `freshnessMap`. Wiki child-node list responses already populate `FeishuWikiNode.version` but that value was not forwarded to `KnowledgeBaseNode` for the tree.

## Goals / Non-Goals

**Goals:**

- Show a stable **local / remote** revision pair on document and bitable tree rows when users have configured a sync root (Tauri).
- Prefer freshness `remoteVersion` when present; otherwise fall back to the revision from the wiki node list for the remote side.
- Keep layout compact (secondary typography, same row as existing tags).

**Non-Goals:**

- Changing freshness algorithms or sync planner behavior
- Showing version aggregates on folder/space rows
- Pushing to remote Git

## Decisions

**D1: Extend `DocumentSyncStatusEntry` with `local_feishu_version`**

- Source: manifest `record.version` for that `document_id`.
- Empty string when absent; serde `default` keeps JSON stable.

**D2: Add `wiki_list_version` to `KnowledgeBaseNode`**

- Source: `FeishuWikiNode.version` when building tree nodes from OpenAPI.
- Used only as UI fallback for “remote” before/without freshness row.
- Fixtures use placeholder values (e.g. `v1`) for browser/tests.

**D3: UI composition**

- For `document` and `bitable` leaves: `本地 {local} / 远端 {remote}` with `—` when unknown.
- `local`: sync status entry `localFeishuVersion` if non-empty, else `—`.
- `remote`: `freshnessMap[docId].remoteVersion` if non-empty, else `treeNode.wikiListVersion`, else `—`.
- Non-Tauri / empty `documentSyncStatuses`: skip version line (no sync root context).

## Risks / Trade-offs

- [Wiki list revision vs document summary revision] → Listing may differ slightly from export API; freshness check remains authoritative when saved.
- [Row width] → Small font and secondary color; ellipsis not required for typical revision strings.

## Migration Plan

None; additive API fields with defaults.

## Open Questions

None.
