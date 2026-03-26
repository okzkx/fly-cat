import type { KnowledgeBaseSpace, SyncCounters, SyncLifecycleState, SyncRunError } from "@/types/sync";

export interface UserInfo {
  name: string;
  avatar?: string;
}

export type ConnectionValidationStatus =
  | "not-configured"
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
  outputPath: string;
  status: SyncTaskStatus;
  progress: number;
  counters: SyncCounters;
  lifecycleState: SyncLifecycleState;
  errors: SyncRunError[];
  createdAt: string;
  updatedAt: string;
}

export interface HomeSyncResult {
  task: SyncTask;
}

export interface AppBootstrap {
  settings: AppSettings | null;
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
  syncRoot: string;
  connectionValidation: ConnectionValidation | null;
  onSpacesChange: (spaces: KnowledgeBaseSpace[]) => void;
  onOpenTasks: () => void;
  activeTaskSummary: string;
  onCreateTask: () => Promise<HomeSyncResult | null>;
}

export interface TaskListPageProps {
  onGoBack: () => void;
}

export interface AuthPageProps {
  validation: ConnectionValidation | null;
  onAuthorized: () => Promise<ConnectionCheckResult>;
  onGoToSettings: () => void;
}

export interface SettingsPageProps {
  initialSettings: AppSettings | null;
  onSaved: (settings: AppSettings) => void;
}
