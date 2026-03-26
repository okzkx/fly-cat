import { invoke } from "@tauri-apps/api/core";
import { listen, type EventCallback, type UnlistenFn } from "@tauri-apps/api/event";
import type { SyncTask } from "@/types/app";
import {
  TASK_EVENTS,
  createSyncTask as createBrowserSyncTask,
  deleteSyncTask as deleteBrowserSyncTask,
  getSyncTasks as getBrowserSyncTasks,
  resumeSyncTasks as resumeBrowserSyncTasks,
  retryFailedTask as retryBrowserFailedTask,
  startSyncTask as startBrowserSyncTask
} from "@/utils/browserTaskManager";

export interface RuntimeInfo {
  runtime: string;
  version: string;
}

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

export async function initializeTaskEventBridge(): Promise<() => void> {
  if (!isTauriRuntime()) {
    return () => undefined;
  }

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

export async function getRuntimeInfo(): Promise<RuntimeInfo> {
  if (!isTauriRuntime()) {
    return {
      runtime: "browser",
      version: "dev"
    };
  }
  return invoke<RuntimeInfo>("get_runtime_info");
}

export async function getSyncTasks(): Promise<SyncTask[]> {
  if (!isTauriRuntime()) {
    return getBrowserSyncTasks();
  }
  return invoke<SyncTask[]>("list_sync_tasks");
}

export async function createSyncTask(selectedSpaces: string[], outputPath: string): Promise<SyncTask> {
  if (!isTauriRuntime()) {
    return createBrowserSyncTask(selectedSpaces, outputPath);
  }
  return invoke<SyncTask>("create_sync_task", {
    request: {
      selectedSpaces,
      outputPath
    }
  });
}

export async function startSyncTask(taskId: string): Promise<void> {
  if (!isTauriRuntime()) {
    startBrowserSyncTask(taskId);
    return;
  }
  await invoke("start_sync_task", { taskId });
}

export async function retryFailedTask(taskId: string): Promise<void> {
  if (!isTauriRuntime()) {
    retryBrowserFailedTask(taskId);
    return;
  }
  await invoke("retry_sync_task", { taskId });
}

export async function resumeSyncTasks(): Promise<SyncTask[]> {
  if (!isTauriRuntime()) {
    return resumeBrowserSyncTasks();
  }
  return invoke<SyncTask[]>("resume_sync_tasks");
}

export async function deleteSyncTask(taskId: string): Promise<void> {
  if (!isTauriRuntime()) {
    deleteBrowserSyncTask(taskId);
    return;
  }
  await invoke("delete_sync_task", { taskId });
}

export { TASK_EVENTS };
