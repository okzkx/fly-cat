import { invoke } from "@tauri-apps/api/core";
import { listen, type EventCallback, type UnlistenFn } from "@tauri-apps/api/event";
import type { AppBootstrap, AppSettings, ConnectionCheckResult, SyncTask, UserInfo } from "@/types/app";
import type { KnowledgeBaseNode, SyncScope } from "@/types/sync";
import {
  TASK_EVENTS,
  createSyncTask as createBrowserSyncTask,
  deleteSyncTask as deleteBrowserSyncTask,
  getSyncTasks as getBrowserSyncTasks,
  listKnowledgeBaseNodes as listBrowserKnowledgeBaseNodes,
  resumeSyncTasks as resumeBrowserSyncTasks,
  retryFailedTask as retryBrowserFailedTask,
  startSyncTask as startBrowserSyncTask
} from "@/utils/browserTaskManager";

export interface RuntimeInfo {
  runtime: string;
  version: string;
}

const BROWSER_SETTINGS_KEY = "feishu_sync_settings";
const BROWSER_USER_KEY = "feishu_sync_user";

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

export async function getAppBootstrap(): Promise<AppBootstrap> {
  if (!isTauriRuntime()) {
    const settingsRaw = localStorage.getItem(BROWSER_SETTINGS_KEY);
    const userRaw = localStorage.getItem(BROWSER_USER_KEY);
    return {
      settings: settingsRaw ? (JSON.parse(settingsRaw) as AppSettings) : null,
      resolvedSyncRoot: settingsRaw ? (JSON.parse(settingsRaw) as AppSettings).syncRoot : null,
      user: userRaw ? (JSON.parse(userRaw) as UserInfo) : null,
      connectionValidation: settingsRaw
        ? userRaw
          ? {
              status: "connected-with-spaces",
              usable: true,
              message: "当前处于浏览器模拟环境，已加载默认知识空间。",
              spacesLoaded: true
            }
          : {
              status: "not-signed-in",
              usable: false,
              message: "当前处于浏览器模拟环境，请点击授权按钮进入模拟登录状态。",
              spacesLoaded: false
            }
        : null,
      spaces: [
        { id: "kb-eng", name: "研发知识库", selected: true },
        { id: "kb-product", name: "产品知识库", selected: false },
        { id: "kb-ops", name: "运维知识库", selected: false }
      ]
    };
  }
  return invoke<AppBootstrap>("get_app_bootstrap");
}

export async function saveAppSettings(settings: AppSettings): Promise<AppSettings> {
  if (!isTauriRuntime()) {
    localStorage.setItem(BROWSER_SETTINGS_KEY, JSON.stringify(settings));
    return settings;
  }
  return invoke<AppSettings>("save_app_settings", { settings });
}

export async function beginUserAuthorization(redirectUri: string): Promise<string> {
  if (!isTauriRuntime()) {
    return redirectUri;
  }
  return invoke<string>("begin_user_authorization", { redirectUri });
}

export async function completeUserAuthorization(code: string, redirectUri: string): Promise<ConnectionCheckResult> {
  if (!isTauriRuntime()) {
    const user = { name: "模拟登录用户", avatar: "", userId: "browser-user" };
    const result: ConnectionCheckResult = {
      user,
      spaces: [
        { id: "kb-eng", name: "研发知识库", selected: true },
        { id: "kb-product", name: "产品知识库", selected: false },
        { id: "kb-ops", name: "运维知识库", selected: false }
      ],
      validation: {
        status: "connected-with-spaces",
        usable: true,
        message: `浏览器模拟授权成功（code=${code || "mock"}）。`,
        spacesLoaded: true
      }
    };
    localStorage.setItem(BROWSER_USER_KEY, JSON.stringify(user));
    return result;
  }
  return invoke<ConnectionCheckResult>("complete_user_authorization", { code, redirectUri });
}

export async function validateFeishuConnection(): Promise<ConnectionCheckResult> {
  if (!isTauriRuntime()) {
    const userRaw = localStorage.getItem(BROWSER_USER_KEY);
    if (!userRaw) {
      return {
        user: null,
        spaces: [],
        validation: {
          status: "not-signed-in",
          usable: false,
          message: "当前处于浏览器模拟环境，请先完成模拟登录。",
          spacesLoaded: false
        }
      };
    }
    return {
      user: JSON.parse(userRaw) as UserInfo,
      spaces: [
        { id: "kb-eng", name: "研发知识库", selected: true },
        { id: "kb-product", name: "产品知识库", selected: false },
        { id: "kb-ops", name: "运维知识库", selected: false }
      ],
      validation: {
        status: "connected-with-spaces",
        usable: true,
        message: "当前处于浏览器模拟环境，已加载默认知识空间。",
        spacesLoaded: true
      }
    };
  }
  return invoke<ConnectionCheckResult>("validate_feishu_connection");
}

export async function logoutUser(): Promise<void> {
  if (!isTauriRuntime()) {
    localStorage.removeItem(BROWSER_USER_KEY);
    return;
  }
  await invoke("logout_user");
}

export async function getSyncTasks(): Promise<SyncTask[]> {
  if (!isTauriRuntime()) {
    return getBrowserSyncTasks();
  }
  return invoke<SyncTask[]>("list_sync_tasks");
}

export async function listKnowledgeBaseNodes(spaceId: string, parentNodeToken?: string): Promise<KnowledgeBaseNode[]> {
  if (!isTauriRuntime()) {
    return listBrowserKnowledgeBaseNodes(spaceId, parentNodeToken);
  }
  return invoke<KnowledgeBaseNode[]>("list_space_source_tree", { spaceId, parentNodeToken });
}

export async function createSyncTask(selectedSources: SyncScope[], outputPath: string): Promise<SyncTask> {
  if (!isTauriRuntime()) {
    return createBrowserSyncTask(selectedSources, outputPath);
  }
  return invoke<SyncTask>("create_sync_task", {
    request: {
      selectedSources,
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
