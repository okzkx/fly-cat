## Context

The sync pipeline in `src-tauri/src/commands.rs` uses `std::thread::scope` with `queued_documents.chunks(concurrency)` where `concurrency = 8`. Each chunk of 8 documents is spawned as parallel threads, then joined sequentially within the chunk. The `emit_task_event` call for each document already exists inside the per-document loop (line 2190-2197), so progress events ARE emitted per document. However, since 8 threads run nearly in parallel, they all complete at similar times, making the UI appear to update in batches of ~8.

The root cause is concurrency = 8 causing 8 documents to complete in rapid succession, not a missing emit call.

## Goals / Non-Goals

**Goals:**
- Make progress updates visually per-document (one at a time) so the user sees steady incremental progress
- Display "已处理 X / 共 Y" total count in the task list UI

**Non-Goals:**
- Changing the overall sync performance or throughput
- Adding pause/resume per-document granularity
- Modifying the manifest batch save logic

## Decisions

### Decision 1: Reduce concurrency from 8 to 1

**Choice:** Set `concurrency = 1` and process documents serially.

**Rationale:** With concurrency = 1, each document completes fully before the next starts. The existing per-document emit call already handles progress events correctly. This is the simplest change that achieves the desired UX. No new mechanisms needed.

**Alternatives considered:**
- Keep concurrency = 8 but add debouncing/throttling on the frontend: Would still show batch-like updates and adds complexity.
- Keep concurrency = 8 but stagger thread starts: Would slow overall throughput without improving clarity.

### Decision 2: Display "已处理 X / 共 Y" using existing counters

**Choice:** Add a line in the "统计" column render function showing `${counters.processed} / 共 ${counters.total}`.

**Rationale:** The `counters.total` and `counters.processed` fields already exist in the SyncTask type and are already updated per document. No backend changes needed for this part.

## Risks / Trade-offs

- **[Slower total sync time]** Reducing concurrency to 1 means documents sync sequentially instead of in parallel batches → Mitigation: Acceptable for user experience; per-document feedback is more important than throughput for the typical document counts involved.
- **[manifest_batch_size becomes irrelevant for progress]** The manifest save every 10 documents still applies for disk persistence, which is fine.
