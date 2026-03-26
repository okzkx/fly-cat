import type { KnowledgeBaseSpace, SyncCounters, SyncLifecycleState, SyncRunError } from "@/types/sync";

export interface UserInfo {
  name: string;
  avatar?: string;
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
}

export interface SyncProgressEventDetail {
  task: SyncTask;
}

export interface HomePageProps {
  spaces: KnowledgeBaseSpace[];
  syncRoot: string;
  onSpacesChange: (spaces: KnowledgeBaseSpace[]) => void;
  onOpenTasks: () => void;
  activeTaskSummary: string;
  onCreateTask: () => Promise<HomeSyncResult | null>;
}

export interface TaskListPageProps {
  onGoBack: () => void;
}

export interface AuthPageProps {
  onAuthorized: () => Promise<void>;
  onGoToSettings: () => void;
}

export interface SettingsPageProps {
  initialSettings: AppSettings | null;
  onSaved: (settings: AppSettings) => void;
}
