export type SyncLifecycleState =
  | "idle"
  | "preparing"
  | "syncing"
  | "partial-failed"
  | "completed";

export interface KnowledgeBaseSpace {
  id: string;
  name: string;
  selected: boolean;
}

export interface SourceDocument {
  id: string;
  spaceId: string;
  title: string;
  updateTime: string;
  version: string;
}

export interface ManifestRecord {
  documentId: string;
  version: string;
  updateTime: string;
  outputPath: string;
  contentHash: string;
  status: "success" | "failed";
  lastSyncedAt: string;
  lastError?: string;
}

export interface SyncManifest {
  records: Record<string, ManifestRecord>;
}

export interface SyncPlan {
  toSync: SourceDocument[];
  toSkip: SourceDocument[];
  toRetry: SourceDocument[];
}

export interface SyncCounters {
  total: number;
  processed: number;
  succeeded: number;
  skipped: number;
  failed: number;
}

export interface SyncRunError {
  documentId: string;
  title: string;
  category: "mcp" | "transform" | "filesystem";
  message: string;
}
