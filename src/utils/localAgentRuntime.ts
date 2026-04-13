import type {
  AppBootstrap,
  AppSettings,
  ConnectionCheckResult,
  ConnectionValidation,
  SyncTask
} from "@/types/app";
import type {
  DocumentFreshnessResult,
  DocumentSyncStatus,
  KnowledgeBaseNode,
  SyncScope
} from "@/types/sync";
import { TASK_EVENTS } from "@/utils/browserTaskManager";
import type {
  RuntimeInfo,
  SyncedMarkdownPreviewPayload
} from "@/utils/runtimeTransportTypes";

interface SimpleSuccess {
  success: boolean;
}

const LOCAL_AGENT_DEFAULT_PORT = 43127;
const LOCAL_AGENT_BASE_URL =
  import.meta.env.VITE_LOCAL_AGENT_URL ??
  `http://127.0.0.1:${import.meta.env.VITE_LOCAL_AGENT_PORT ?? LOCAL_AGENT_DEFAULT_PORT}/api/v1`;

let taskCache: SyncTask[] | null = null;
let pollingSubscribers = 0;
let pollingTimer: number | null = null;
let pollInFlight = false;
let taskSnapshot = new Map<string, string>();

export function buildLocalAgentUnavailableValidation(error?: unknown): ConnectionValidation {
  const detail =
    error instanceof Error ? error.message : typeof error === "string" ? error : undefined;

  return {
    status: "request-failed",
    usable: false,
    message: `无法连接本机桌面桥接服务（${LOCAL_AGENT_BASE_URL}）。请先启动飞猫助手桌面版，再刷新当前浏览器页面。`,
    diagnostics: detail,
    spacesLoaded: false
  };
}

export function buildLocalAgentUnavailableBootstrap(error?: unknown): AppBootstrap {
  return {
    settings: null,
    resolvedSyncRoot: null,
    user: null,
    spaces: [],
    connectionValidation: buildLocalAgentUnavailableValidation(error)
  };
}

export function buildLocalAgentUnavailableConnection(error?: unknown): ConnectionCheckResult {
  return {
    user: null,
    spaces: [],
    validation: buildLocalAgentUnavailableValidation(error)
  };
}

function rememberTasks(tasks: SyncTask[]): SyncTask[] {
  taskCache = tasks;
  return tasks;
}

function resetTaskCache(): void {
  taskCache = null;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, value);
    }
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

function taskSnapshotKey(task: SyncTask): string {
  return [
    task.status,
    task.progress,
    task.lifecycleState,
    task.updatedAt,
    task.counters.processed,
    task.counters.total,
    task.counters.failed
  ].join(":");
}

function dispatchTaskEvent(name: string, detail?: unknown): void {
  if (typeof window === "undefined") {
    return;
  }
  window.dispatchEvent(new CustomEvent(name, detail === undefined ? undefined : { detail }));
}

async function requestLocalAgent<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${LOCAL_AGENT_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const errorPayload = (await response.json()) as { error?: string };
      if (errorPayload.error) {
        message = errorPayload.error;
      }
    } catch {
      // ignore non-JSON error bodies
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function fetchTasks(force = false): Promise<SyncTask[]> {
  if (!force && taskCache) {
    return taskCache;
  }

  const tasks = await requestLocalAgent<SyncTask[]>("/tasks");
  return rememberTasks(tasks);
}

function handlePolledTasks(tasks: SyncTask[]): void {
  const nextSnapshot = new Map<string, string>();
  let changed = tasks.length !== taskSnapshot.size;

  for (const task of tasks) {
    const snapshot = taskSnapshotKey(task);
    nextSnapshot.set(task.id, snapshot);

    const previous = taskSnapshot.get(task.id);
    if (previous === snapshot) {
      continue;
    }

    changed = true;

    if (task.status === "pending" || task.status === "syncing") {
      dispatchTaskEvent(TASK_EVENTS.progress, { task });
    }
    if (task.status === "completed" && !previous?.includes("completed")) {
      dispatchTaskEvent(TASK_EVENTS.completed, { task });
    }
    if (task.status === "partial-failed" && !previous?.includes("partial-failed")) {
      dispatchTaskEvent(TASK_EVENTS.failed, { task });
    }
  }

  if (changed) {
    dispatchTaskEvent(TASK_EVENTS.statusChanged);
  }

  taskSnapshot = nextSnapshot;
}

async function pollTasks(): Promise<void> {
  if (pollInFlight) {
    return;
  }

  pollInFlight = true;
  try {
    const tasks = await fetchTasks(true);
    handlePolledTasks(tasks);
  } catch {
    // Startup/bootstrap shows agent availability explicitly.
  } finally {
    pollInFlight = false;
  }
}

export async function initializeLocalAgentTaskBridge(): Promise<() => void> {
  pollingSubscribers += 1;

  if (pollingTimer === null) {
    void pollTasks();
    pollingTimer = window.setInterval(() => {
      void pollTasks();
    }, 1500);
  }

  return () => {
    pollingSubscribers = Math.max(0, pollingSubscribers - 1);
    if (pollingSubscribers === 0 && pollingTimer !== null) {
      window.clearInterval(pollingTimer);
      pollingTimer = null;
      taskSnapshot = new Map();
    }
  };
}

export async function localAgentGetRuntimeInfo(): Promise<RuntimeInfo> {
  try {
    return await requestLocalAgent<RuntimeInfo>("/runtime");
  } catch {
    return {
      runtime: "browser-local-agent-unavailable",
      version: "dev"
    };
  }
}

export async function localAgentGetAppBootstrap(): Promise<AppBootstrap> {
  try {
    return await requestLocalAgent<AppBootstrap>("/bootstrap");
  } catch (error) {
    return buildLocalAgentUnavailableBootstrap(error);
  }
}

export function localAgentSaveAppSettings(settings: AppSettings): Promise<AppSettings> {
  return requestLocalAgent<AppSettings>("/settings", {
    method: "PUT",
    body: JSON.stringify(settings)
  });
}

export function localAgentBeginUserAuthorization(redirectUri: string): Promise<string> {
  return requestLocalAgent<string>("/auth/begin", {
    method: "POST",
    body: JSON.stringify({ redirectUri })
  });
}

export function localAgentCompleteUserAuthorization(
  code: string,
  redirectUri: string
): Promise<ConnectionCheckResult> {
  return requestLocalAgent<ConnectionCheckResult>("/auth/complete", {
    method: "POST",
    body: JSON.stringify({ code, redirectUri })
  });
}

export async function localAgentValidateFeishuConnection(): Promise<ConnectionCheckResult> {
  try {
    return await requestLocalAgent<ConnectionCheckResult>("/auth/validate");
  } catch (error) {
    return buildLocalAgentUnavailableConnection(error);
  }
}

export async function localAgentLogoutUser(): Promise<void> {
  await requestLocalAgent<SimpleSuccess>("/auth/logout", {
    method: "POST"
  });
}

export async function localAgentGetSyncTasks(): Promise<SyncTask[]> {
  try {
    return await fetchTasks();
  } catch {
    return taskCache ?? [];
  }
}

export function localAgentListKnowledgeBaseNodes(
  spaceId: string,
  parentNodeToken?: string
): Promise<KnowledgeBaseNode[]> {
  return requestLocalAgent<KnowledgeBaseNode[]>(
    `/spaces/${encodeURIComponent(spaceId)}/tree${buildQuery({ parentNodeToken })}`
  );
}

export async function localAgentCreateSyncTask(
  selectedSources: SyncScope[],
  outputPath: string
): Promise<SyncTask> {
  const task = await requestLocalAgent<SyncTask>("/tasks", {
    method: "POST",
    body: JSON.stringify({ selectedSources, outputPath })
  });
  resetTaskCache();
  return task;
}

export async function localAgentStartSyncTask(taskId: string): Promise<void> {
  await requestLocalAgent<SimpleSuccess>(`/tasks/${encodeURIComponent(taskId)}/start`, {
    method: "POST"
  });
  resetTaskCache();
}

export async function localAgentRetryFailedTask(taskId: string): Promise<void> {
  await requestLocalAgent<SimpleSuccess>(`/tasks/${encodeURIComponent(taskId)}/retry`, {
    method: "POST"
  });
  resetTaskCache();
}

export async function localAgentResumeSyncTasks(): Promise<SyncTask[]> {
  resetTaskCache();
  const tasks = await requestLocalAgent<SyncTask[]>("/tasks/resume", {
    method: "POST"
  });
  return rememberTasks(tasks);
}

export async function localAgentDeleteSyncTask(taskId: string): Promise<void> {
  await requestLocalAgent<SimpleSuccess>(`/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE"
  });
  resetTaskCache();
}

export async function localAgentClearAllSyncTasks(): Promise<void> {
  await requestLocalAgent<SimpleSuccess>("/tasks", {
    method: "DELETE"
  });
  rememberTasks([]);
}

export function localAgentReadSyncedMarkdownPreview(
  syncRoot: string,
  documentId: string
): Promise<SyncedMarkdownPreviewPayload> {
  return requestLocalAgent<SyncedMarkdownPreviewPayload>("/preview/read", {
    method: "POST",
    body: JSON.stringify({ syncRoot, documentId })
  });
}

export async function localAgentGetSyncedDocumentIds(syncRoot: string): Promise<Set<string>> {
  try {
    const ids = await requestLocalAgent<string[]>(
      `/synced-documents/ids${buildQuery({ syncRoot })}`
    );
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export async function localAgentGetDocumentSyncStatuses(
  syncRoot: string
): Promise<Record<string, DocumentSyncStatus>> {
  try {
    return await requestLocalAgent<Record<string, DocumentSyncStatus>>(
      `/synced-documents/statuses${buildQuery({ syncRoot })}`
    );
  } catch {
    return {};
  }
}

export function localAgentRemoveSyncedDocuments(syncRoot: string, documentIds: string[]): Promise<number> {
  return requestLocalAgent<number>("/synced-documents/remove", {
    method: "POST",
    body: JSON.stringify({ syncRoot, documentIds })
  });
}

export function localAgentPrepareForceRepulledDocuments(
  syncRoot: string,
  documentIds: string[]
): Promise<number> {
  return requestLocalAgent<number>("/synced-documents/prepare-force-repull", {
    method: "POST",
    body: JSON.stringify({ syncRoot, documentIds })
  });
}

export function localAgentCheckDocumentFreshness(
  documentIds: string[],
  syncRoot: string
): Promise<Record<string, DocumentFreshnessResult>> {
  return requestLocalAgent<Record<string, DocumentFreshnessResult>>("/freshness/check", {
    method: "POST",
    body: JSON.stringify({ documentIds, syncRoot })
  });
}

export function localAgentLoadFreshnessMetadata(
  syncRoot: string
): Promise<Record<string, DocumentFreshnessResult>> {
  return requestLocalAgent<Record<string, DocumentFreshnessResult>>("/freshness/load", {
    method: "POST",
    body: JSON.stringify({ syncRoot })
  });
}

export async function localAgentSaveFreshnessMetadata(
  syncRoot: string,
  metadata: Record<string, DocumentFreshnessResult>
): Promise<void> {
  await requestLocalAgent<SimpleSuccess>("/freshness/save", {
    method: "POST",
    body: JSON.stringify({ syncRoot, metadata })
  });
}

export function localAgentAlignDocumentSyncVersions(
  syncRoot: string,
  metadata: Record<string, DocumentFreshnessResult>,
  force = false
): Promise<Record<string, DocumentFreshnessResult>> {
  return requestLocalAgent<Record<string, DocumentFreshnessResult>>("/freshness/align", {
    method: "POST",
    body: JSON.stringify({ syncRoot, metadata, force })
  });
}

export async function localAgentClearFreshnessMetadata(
  syncRoot: string,
  documentIds: string[]
): Promise<void> {
  await requestLocalAgent<SimpleSuccess>("/freshness/clear", {
    method: "POST",
    body: JSON.stringify({ syncRoot, documentIds })
  });
}

export async function localAgentOpenWorkspaceFolder(
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requestLocalAgent<SimpleSuccess>("/system/open-path", {
      method: "POST",
      body: JSON.stringify({ path })
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
