import type { ManifestRecord, SourceDocument, SyncManifest, SyncPlan } from "@/types/sync";

function shouldRetry(record?: ManifestRecord): boolean {
  return record?.status === "failed";
}

function isUnchanged(document: SourceDocument, record?: ManifestRecord): boolean {
  if (!record) {
    return false;
  }

  const recordPath = record.sourcePath ?? "";
  return (
    record.status === "success" &&
    record.version === document.version &&
    record.updateTime === document.updateTime &&
    recordPath === document.sourcePath
  );
}

export function buildSyncPlan(documents: SourceDocument[], manifest: SyncManifest): SyncPlan {
  const toSync: SourceDocument[] = [];
  const toSkip: SourceDocument[] = [];
  const toRetry: SourceDocument[] = [];

  for (const document of documents) {
    const record = manifest.records[document.id];
    if (shouldRetry(record)) {
      toRetry.push(document);
      continue;
    }
    if (isUnchanged(document, record)) {
      toSkip.push(document);
      continue;
    }
    toSync.push(document);
  }

  return { toSync, toSkip, toRetry };
}
