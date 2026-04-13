import { invoke } from "@tauri-apps/api/core";
import { listen, type EventCallback, type UnlistenFn } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import type {
  AppBootstrap,
  AppSettings,
  ConnectionCheckResult,
  SyncTask
} from "@/types/app";
import type {
  DocumentFreshnessResult,
  DocumentSyncStatus,
  KnowledgeBaseNode,
  SyncScope
} from "@/types/sync";
import {
  fixtureAlignDocumentSyncVersions,
  fixtureBeginUserAuthorization,
  fixtureCheckDocumentFreshness,
  fixtureClearAllSyncTasks,
  fixtureClearFreshnessMetadata,
  fixtureCompleteUserAuthorization,
  fixtureCreateSyncTask,
  fixtureDeleteSyncTask,
  fixtureGetAppBootstrap,
  fixtureGetDocumentSyncStatuses,
  fixtureGetRuntimeInfo,
  fixtureGetSyncTasks,
  fixtureGetSyncedDocumentIds,
  fixtureInitializeTaskEventBridge,
  fixtureListKnowledgeBaseNodes,
  fixtureLoadFreshnessMetadata,
  fixtureLogoutUser,
  fixtureOpenWorkspaceFolder,
  fixturePrepareForceRepulledDocuments,
  fixtureReadSyncedMarkdownPreview,
  fixtureRemoveSyncedDocuments,
  fixtureResumeSyncTasks,
  fixtureRetryFailedTask,
  fixtureSaveAppSettings,
  fixtureSaveFreshnessMetadata,
  fixtureStartSyncTask,
  fixtureValidateFeishuConnection,
  isFixtureRuntime
} from "@/utils/browserFixtureRuntime";
import {
  initializeLocalAgentTaskBridge,
  localAgentAlignDocumentSyncVersions,
  localAgentBeginUserAuthorization,
  localAgentCheckDocumentFreshness,
  localAgentClearAllSyncTasks,
  localAgentClearFreshnessMetadata,
  localAgentCompleteUserAuthorization,
  localAgentCreateSyncTask,
  localAgentDeleteSyncTask,
  localAgentGetAppBootstrap,
  localAgentGetDocumentSyncStatuses,
  localAgentGetRuntimeInfo,
  localAgentGetSyncTasks,
  localAgentGetSyncedDocumentIds,
  localAgentListKnowledgeBaseNodes,
  localAgentLoadFreshnessMetadata,
  localAgentLogoutUser,
  localAgentOpenWorkspaceFolder,
  localAgentPrepareForceRepulledDocuments,
  localAgentReadSyncedMarkdownPreview,
  localAgentRemoveSyncedDocuments,
  localAgentResumeSyncTasks,
  localAgentRetryFailedTask,
  localAgentSaveAppSettings,
  localAgentSaveFreshnessMetadata,
  localAgentStartSyncTask,
  localAgentValidateFeishuConnection
} from "@/utils/localAgentRuntime";
import {
  ExternalOpenResult,
  RuntimeInfo,
  SyncedMarkdownPreviewPayload
} from "@/utils/runtimeTransportTypes";
import { buildFeishuBrowserUrl, type BrowserOpenTarget } from "@/utils/feishuBrowserUrl";
import { TASK_EVENTS } from "@/utils/browserTaskManager";

export type {
  ExternalOpenResult,
  RuntimeInfo,
  SyncedMarkdownPreviewPayload
} from "@/utils/runtimeTransportTypes";

export function isTauriRuntime(): boolean {
  return "__TAURI_INTERNALS__" in window;
}

function bridgeEvent(detail: unknown): void {
  const payload = detail as { task?: SyncTask };
  const task = payload.task ?? (detail as SyncTask);
  if (!task) {
    return;
  }

  let eventName: string = TASK_EVENTS.statusChanged;
  if (task.status === "syncing") {
    eventName = TASK_EVENTS.progress;
  } else if (task.status === "completed") {
    eventName = TASK_EVENTS.completed;
  } else if (task.status === "partial-failed") {
    eventName = TASK_EVENTS.failed;
  }

  window.dispatchEvent(new CustomEvent(eventName, { detail: { task } }));
  window.dispatchEvent(new CustomEvent(TASK_EVENTS.statusChanged, { detail: { task } }));
}

async function initializeTauriTaskEventBridge(): Promise<() => void> {
  const unsubscribers: UnlistenFn[] = [];
  const eventNames = [TASK_EVENTS.progress, TASK_EVENTS.statusChanged, TASK_EVENTS.completed, TASK_EVENTS.failed];

  for (const eventName of eventNames) {
    const callback: EventCallback<unknown> = (event) => bridgeEvent(event.payload);
    unsubscribers.push(await listen(eventName, callback));
  }

  return () => {
    unsubscribers.forEach((unlisten) => unlisten());
  };
}

export async function initializeTaskEventBridge(): Promise<() => void> {
  if (isTauriRuntime()) {
    return initializeTauriTaskEventBridge();
  }
  if (isFixtureRuntime()) {
    return fixtureInitializeTaskEventBridge();
  }
  return initializeLocalAgentTaskBridge();
}

export async function getRuntimeInfo(): Promise<RuntimeInfo> {
  if (isTauriRuntime()) {
    return invoke<RuntimeInfo>("get_runtime_info");
  }
  if (isFixtureRuntime()) {
    return fixtureGetRuntimeInfo();
  }
  return localAgentGetRuntimeInfo();
}

export async function getAppBootstrap(): Promise<AppBootstrap> {
  if (isTauriRuntime()) {
    return invoke<AppBootstrap>("get_app_bootstrap");
  }
  if (isFixtureRuntime()) {
    return fixtureGetAppBootstrap();
  }
  return localAgentGetAppBootstrap();
}

export async function saveAppSettings(settings: AppSettings): Promise<AppSettings> {
  if (isTauriRuntime()) {
    return invoke<AppSettings>("save_app_settings", { settings });
  }
  if (isFixtureRuntime()) {
    return fixtureSaveAppSettings(settings);
  }
  return localAgentSaveAppSettings(settings);
}

export async function beginUserAuthorization(redirectUri: string): Promise<string> {
  if (isTauriRuntime()) {
    return invoke<string>("begin_user_authorization", { redirectUri });
  }
  if (isFixtureRuntime()) {
    return fixtureBeginUserAuthorization(redirectUri);
  }
  return localAgentBeginUserAuthorization(redirectUri);
}

export async function completeUserAuthorization(
  code: string,
  redirectUri: string
): Promise<ConnectionCheckResult> {
  if (isTauriRuntime()) {
    return invoke<ConnectionCheckResult>("complete_user_authorization", { code, redirectUri });
  }
  if (isFixtureRuntime()) {
    return fixtureCompleteUserAuthorization(code);
  }
  return localAgentCompleteUserAuthorization(code, redirectUri);
}

export async function validateFeishuConnection(): Promise<ConnectionCheckResult> {
  if (isTauriRuntime()) {
    return invoke<ConnectionCheckResult>("validate_feishu_connection");
  }
  if (isFixtureRuntime()) {
    return fixtureValidateFeishuConnection();
  }
  return localAgentValidateFeishuConnection();
}

export async function logoutUser(): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("logout_user");
    return;
  }
  if (isFixtureRuntime()) {
    return fixtureLogoutUser();
  }
  return localAgentLogoutUser();
}

export async function getSyncTasks(): Promise<SyncTask[]> {
  if (isTauriRuntime()) {
    return invoke<SyncTask[]>("list_sync_tasks");
  }
  if (isFixtureRuntime()) {
    return fixtureGetSyncTasks();
  }
  return localAgentGetSyncTasks();
}

export async function listKnowledgeBaseNodes(
  spaceId: string,
  parentNodeToken?: string
): Promise<KnowledgeBaseNode[]> {
  if (isTauriRuntime()) {
    return invoke<KnowledgeBaseNode[]>("list_space_source_tree", { spaceId, parentNodeToken });
  }
  if (isFixtureRuntime()) {
    return fixtureListKnowledgeBaseNodes(spaceId, parentNodeToken);
  }
  return localAgentListKnowledgeBaseNodes(spaceId, parentNodeToken);
}

export async function createSyncTask(selectedSources: SyncScope[], outputPath: string): Promise<SyncTask> {
  if (isTauriRuntime()) {
    return invoke<SyncTask>("create_sync_task", {
      request: {
        selectedSources,
        outputPath
      }
    });
  }
  if (isFixtureRuntime()) {
    return fixtureCreateSyncTask(selectedSources, outputPath);
  }
  return localAgentCreateSyncTask(selectedSources, outputPath);
}

export async function startSyncTask(taskId: string): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("start_sync_task", { taskId });
    return;
  }
  if (isFixtureRuntime()) {
    return fixtureStartSyncTask(taskId);
  }
  return localAgentStartSyncTask(taskId);
}

export async function retryFailedTask(taskId: string): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("retry_sync_task", { taskId });
    return;
  }
  if (isFixtureRuntime()) {
    return fixtureRetryFailedTask(taskId);
  }
  return localAgentRetryFailedTask(taskId);
}

export async function resumeSyncTasks(): Promise<SyncTask[]> {
  if (isTauriRuntime()) {
    return invoke<SyncTask[]>("resume_sync_tasks");
  }
  if (isFixtureRuntime()) {
    return fixtureResumeSyncTasks();
  }
  return localAgentResumeSyncTasks();
}

export async function deleteSyncTask(taskId: string): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("delete_sync_task", { taskId });
    return;
  }
  if (isFixtureRuntime()) {
    return fixtureDeleteSyncTask(taskId);
  }
  return localAgentDeleteSyncTask(taskId);
}

export async function clearAllSyncTasks(): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("clear_all_sync_tasks");
    return;
  }
  if (isFixtureRuntime()) {
    return fixtureClearAllSyncTasks();
  }
  return localAgentClearAllSyncTasks();
}

export async function readSyncedMarkdownPreview(
  syncRoot: string,
  documentId: string
): Promise<SyncedMarkdownPreviewPayload> {
  if (isTauriRuntime()) {
    return invoke<SyncedMarkdownPreviewPayload>("read_synced_markdown_preview", { syncRoot, documentId });
  }
  if (isFixtureRuntime()) {
    return fixtureReadSyncedMarkdownPreview();
  }
  return localAgentReadSyncedMarkdownPreview(syncRoot, documentId);
}

export async function getSyncedDocumentIds(syncRoot: string): Promise<Set<string>> {
  if (isTauriRuntime()) {
    const ids = await invoke<string[]>("get_synced_document_ids", { syncRoot });
    return new Set(ids);
  }
  if (isFixtureRuntime()) {
    return fixtureGetSyncedDocumentIds();
  }
  return localAgentGetSyncedDocumentIds(syncRoot);
}

export async function getDocumentSyncStatuses(
  syncRoot: string
): Promise<Record<string, DocumentSyncStatus>> {
  if (isTauriRuntime()) {
    return invoke<Record<string, DocumentSyncStatus>>("get_document_sync_statuses", { syncRoot });
  }
  if (isFixtureRuntime()) {
    return fixtureGetDocumentSyncStatuses();
  }
  return localAgentGetDocumentSyncStatuses(syncRoot);
}

export async function removeSyncedDocuments(syncRoot: string, documentIds: string[]): Promise<number> {
  if (isTauriRuntime()) {
    return invoke<number>("remove_synced_documents", {
      request: { syncRoot, documentIds }
    });
  }
  if (isFixtureRuntime()) {
    return fixtureRemoveSyncedDocuments();
  }
  return localAgentRemoveSyncedDocuments(syncRoot, documentIds);
}

export async function prepareForceRepulledDocuments(
  syncRoot: string,
  documentIds: string[]
): Promise<number> {
  if (isTauriRuntime()) {
    return invoke<number>("prepare_force_repulled_documents", {
      request: { syncRoot, documentIds }
    });
  }
  if (isFixtureRuntime()) {
    return fixturePrepareForceRepulledDocuments();
  }
  return localAgentPrepareForceRepulledDocuments(syncRoot, documentIds);
}

export async function checkDocumentFreshness(
  documentIds: string[],
  syncRoot: string
): Promise<Record<string, DocumentFreshnessResult>> {
  if (isTauriRuntime()) {
    return invoke<Record<string, DocumentFreshnessResult>>("check_document_freshness", {
      documentIds,
      syncRoot
    });
  }
  if (isFixtureRuntime()) {
    return fixtureCheckDocumentFreshness();
  }
  return localAgentCheckDocumentFreshness(documentIds, syncRoot);
}

export async function loadFreshnessMetadata(
  syncRoot: string
): Promise<Record<string, DocumentFreshnessResult>> {
  if (isTauriRuntime()) {
    return invoke<Record<string, DocumentFreshnessResult>>("load_freshness_metadata", {
      syncRoot
    });
  }
  if (isFixtureRuntime()) {
    return fixtureLoadFreshnessMetadata();
  }
  return localAgentLoadFreshnessMetadata(syncRoot);
}

export async function saveFreshnessMetadata(
  syncRoot: string,
  metadata: Record<string, DocumentFreshnessResult>
): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("save_freshness_metadata", {
      syncRoot,
      metadata
    });
    return;
  }
  if (isFixtureRuntime()) {
    return fixtureSaveFreshnessMetadata();
  }
  return localAgentSaveFreshnessMetadata(syncRoot, metadata);
}

export async function alignDocumentSyncVersions(
  syncRoot: string,
  metadata: Record<string, DocumentFreshnessResult>,
  force = false
): Promise<Record<string, DocumentFreshnessResult>> {
  if (isTauriRuntime()) {
    return invoke<Record<string, DocumentFreshnessResult>>("align_document_sync_versions", {
      syncRoot,
      metadata,
      force
    });
  }
  if (isFixtureRuntime()) {
    return fixtureAlignDocumentSyncVersions(metadata);
  }
  return localAgentAlignDocumentSyncVersions(syncRoot, metadata, force);
}

export async function clearFreshnessMetadata(
  syncRoot: string,
  documentIds: string[]
): Promise<void> {
  if (isTauriRuntime()) {
    await invoke("clear_freshness_metadata", {
      syncRoot,
      documentIds
    });
    return;
  }
  if (isFixtureRuntime()) {
    return fixtureClearFreshnessMetadata();
  }
  return localAgentClearFreshnessMetadata(syncRoot, documentIds);
}

export async function openWorkspaceFolder(path: string): Promise<{ success: boolean; error?: string }> {
  if (isTauriRuntime()) {
    try {
      await invoke("open_workspace_folder", { path });
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMessage };
    }
  }
  if (isFixtureRuntime()) {
    return fixtureOpenWorkspaceFolder();
  }
  return localAgentOpenWorkspaceFolder(path);
}

export async function openExternalUrl(url: string): Promise<ExternalOpenResult> {
  if (!isTauriRuntime()) {
    try {
      const opened = window.open(url, "_blank", "noopener,noreferrer");
      if (opened === null) {
        return { success: false, error: "浏览器拦截了新窗口，请允许弹窗后重试" };
      }
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return { success: false, error: errorMessage };
    }
  }

  try {
    await openUrl(url);
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return { success: false, error: errorMessage };
  }
}

export async function openDocumentInBrowser(
  target: BrowserOpenTarget
): Promise<{ success: boolean; error?: string }> {
  const { url, error } = buildFeishuBrowserUrl(target);
  if (!url) {
    return { success: false, error: error || "无法在浏览器中打开当前内容" };
  }
  return openExternalUrl(url);
}

export { TASK_EVENTS };
