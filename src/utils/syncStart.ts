import type { SyncScope } from "@/types/sync";

export function shouldSkipTaskCreationAfterCleanup(
  uncheckedSyncedDocumentIds: string[],
  selectedSources: SyncScope[]
): boolean {
  return uncheckedSyncedDocumentIds.length > 0 && selectedSources.length === 0;
}
