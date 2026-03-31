export type SyncLifecycleState =
  | "idle"
  | "preparing"
  | "discovering"
  | "syncing"
  | "partial-failed"
  | "completed";

export interface KnowledgeBaseSpace {
  id: string;
  name: string;
  selected: boolean;
}

export type KnowledgeBaseNodeKind = "space" | "folder" | "document" | "bitable";
export type SyncScopeKind = KnowledgeBaseNodeKind;
export type SyncSelectionSummaryKind = SyncScopeKind | "multi-document" | "multi-source";

export interface SyncScope {
  kind: SyncScopeKind;
  spaceId: string;
  spaceName: string;
  title: string;
  displayPath: string;
  nodeToken?: string;
  documentId?: string;
  pathSegments: string[];
  includesDescendants?: boolean;
}

export interface SyncSelectionSummary {
  kind: SyncSelectionSummaryKind;
  spaceId: string;
  spaceName: string;
  title: string;
  displayPath: string;
  documentCount: number;
  previewPaths: string[];
  includesDescendants?: boolean;
  rootCount?: number;
}

export interface KnowledgeBaseNode {
  key: string;
  kind: Exclude<KnowledgeBaseNodeKind, "space">;
  spaceId: string;
  spaceName: string;
  title: string;
  displayPath: string;
  nodeToken: string;
  documentId?: string;
  pathSegments: string[];
  /** Revision from wiki node list API (fallback for remote display). */
  wikiListVersion?: string;
  hasChildren: boolean;
  isExpandable: boolean;
  children?: KnowledgeBaseNode[];
}

export interface SourceDocument {
  id: string;
  spaceId: string;
  spaceName: string;
  nodeToken: string;
  title: string;
  updateTime: string;
  version: string;
  pathSegments: string[];
  sourcePath: string;
}

export interface ManifestRecord {
  documentId: string;
  spaceId?: string;
  spaceName?: string;
  title?: string;
  nodeToken?: string;
  version: string;
  updateTime: string;
  sourcePath?: string;
  pathSegments?: string[];
  selectedScope?: SyncScope;
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

export type SyncFailureCategory =
  | "auth"
  | "discovery"
  | "content-fetch"
  | "markdown-render"
  | "image-resolution"
  | "filesystem-write"
  | "mcp"
  | "transform"
  | "filesystem";

export interface SyncRunError {
  documentId: string;
  title: string;
  category: SyncFailureCategory;
  message: string;
}

export interface SyncFailureSummary {
  category: SyncFailureCategory;
  message: string;
  count: number;
}

export interface DocumentSyncStatus {
  status: "synced" | "failed";
  lastSyncedAt: string;
  /** Manifest Feishu revision for this document (last sync). */
  localFeishuVersion?: string;
}

export interface DocumentFreshnessResult {
  status: "current" | "updated" | "new" | "error";
  localVersion: string;
  remoteVersion: string;
  localUpdateTime: string;
  remoteUpdateTime: string;
  error?: string;
}
