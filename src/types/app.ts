import type {
  DocumentSyncStatus,
  KnowledgeBaseNode,
  KnowledgeBaseSpace,
  SyncCounters,
  SyncFailureSummary,
  SyncLifecycleState,
  SyncRunError,
  SyncScope,
  SyncSelectionSummary
} from "@/types/sync";

export interface UserInfo {
  name: string;
  avatar?: string;
  email?: string;
  userId?: string;
}

export type ConnectionValidationStatus =
  | "not-configured"
  | "not-signed-in"
  | "session-expired"
  | "reauthorization-required"
  | "connected-with-spaces"
  | "connected-no-spaces"
  | "permission-denied"
  | "request-failed"
  | "unexpected-response";

export interface ConnectionValidation {
  status: ConnectionValidationStatus;
  usable: boolean;
  message: string;
  diagnostics?: string;
  spacesLoaded: boolean;
}

export interface AppSettings {
  appId: string;
  appSecret: string;
  endpoint: string;
  syncRoot: string;
  mcpServerName: string;
  imageDirName: string;
  wikiSpaceIds?: string;
}

export type AppPage = "settings" | "auth" | "home" | "tasks";

export type SyncTaskStatus = "pending" | "syncing" | "completed" | "partial-failed" | "paused";

export interface SyncTask {
  id: string;
  name: string;
  selectedSpaces: string[];
  selectedSources?: SyncScope[];
  selectionSummary?: SyncSelectionSummary | null;
  selectedScope?: SyncScope | null;
  outputPath: string;
  status: SyncTaskStatus;
  progress: number;
  counters: SyncCounters;
  discoveredDocumentIds?: string[];
  lifecycleState: SyncLifecycleState;
  errors: SyncRunError[];
  failureSummary?: SyncFailureSummary | null;
  createdAt: string;
  updatedAt: string;
}

export interface HomeSyncResult {
  task?: SyncTask;
  cleanupOnly?: boolean;
  message?: string;
}

export interface HomeTaskCreateOptions {
  startImmediately?: boolean;
}

export interface AppBootstrap {
  settings: AppSettings | null;
  resolvedSyncRoot: string | null;
  user: UserInfo | null;
  spaces: KnowledgeBaseSpace[];
  connectionValidation: ConnectionValidation | null;
}

export interface ConnectionCheckResult {
  user: UserInfo | null;
  spaces: KnowledgeBaseSpace[];
  validation: ConnectionValidation;
}

export interface SyncProgressEventDetail {
  task: SyncTask;
}

export interface HomePageProps {
  spaces: KnowledgeBaseSpace[];
  selectedScope: SyncScope | null;
  selectedSources: SyncScope[];
  loadedSpaceTrees: Record<string, KnowledgeBaseNode[]>;
  syncRoot: string;
  connectionValidation: ConnectionValidation | null;
  downloadedDocumentIds: Set<string>;
  documentSyncStatuses: Record<string, DocumentSyncStatus>;
  activeSyncTask: SyncTask | null;
  onScopeChange: (scope: SyncScope) => void;
  onToggleSource: (
    source: SyncScope,
    checked: boolean
  ) => Promise<{ replacedCrossSpaceSelection: boolean }>;
  onLoadTreeChildren: (spaceId: string, parentNodeToken?: string) => Promise<void>;
  onOpenTasks: () => void;
  activeTaskSummary: string;
  onCreateTask: (options?: HomeTaskCreateOptions) => Promise<HomeSyncResult | null>;
  onStartTask: (taskId: string) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onBatchDeleteCheckedSyncedDocuments: (documentIds: string[]) => Promise<void>;
  onReloadDocumentSyncStatuses: () => Promise<Record<string, DocumentSyncStatus>>;
  onResyncDocumentScope: (scope: SyncScope) => Promise<void>;
}

export interface TaskListPageProps {
  onGoBack: () => void;
  initialTasks?: SyncTask[];
}

export interface AuthPageProps {
  validation: ConnectionValidation | null;
  onAuthorized: (result: ConnectionCheckResult) => void;
  onGoToSettings: () => void;
}

export interface SettingsPageProps {
  initialSettings: AppSettings | null;
  onSaved: (settings: AppSettings) => void;
}
