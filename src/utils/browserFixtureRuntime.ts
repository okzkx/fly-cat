import type {
  AppBootstrap,
  AppSettings,
  ConnectionCheckResult,
  ConnectionValidation,
  SyncTask,
  UserInfo
} from "@/types/app";
import type {
  DocumentFreshnessResult,
  DocumentSyncStatus,
  KnowledgeBaseNode,
  KnowledgeBaseSpace,
  SyncScope
} from "@/types/sync";
import {
  clearAllSyncTasks as clearBrowserAllSyncTasks,
  createSyncTask as createBrowserSyncTask,
  deleteSyncTask as deleteBrowserSyncTask,
  getSyncTasks as getBrowserSyncTasks,
  listKnowledgeBaseNodes as listBrowserKnowledgeBaseNodes,
  resumeSyncTasks as resumeBrowserSyncTasks,
  retryFailedTask as retryBrowserFailedTask,
  startSyncTask as startBrowserSyncTask
} from "@/utils/browserTaskManager";
import type {
  RuntimeInfo,
  SyncedMarkdownPreviewPayload
} from "@/utils/runtimeTransportTypes";

const BROWSER_SETTINGS_KEY = "feishu_sync_settings";
const BROWSER_USER_KEY = "feishu_sync_user";
const ENABLE_BROWSER_FIXTURES = import.meta.env.VITE_ENABLE_BROWSER_FIXTURES === "true";

const FIXTURE_SPACES: KnowledgeBaseSpace[] = [
  { id: "kb-eng", name: "研发知识库", selected: true },
  { id: "kb-product", name: "产品知识库", selected: false },
  { id: "kb-ops", name: "运维知识库", selected: false }
];

export function isFixtureRuntime(): boolean {
  return ENABLE_BROWSER_FIXTURES;
}

function buildFixtureValidation(user: UserInfo | null, code?: string): ConnectionValidation {
  if (user) {
    return {
      status: "connected-with-spaces",
      usable: true,
      message: code
        ? `浏览器夹具授权成功（code=${code || "fixture"}）。`
        : "当前处于浏览器夹具环境，已加载默认知识空间。",
      spacesLoaded: true
    };
  }

  return {
    status: "not-signed-in",
    usable: false,
    message: "当前处于浏览器夹具环境，请点击授权按钮进入模拟登录状态。",
    spacesLoaded: false
  };
}

export function fixtureInitializeTaskEventBridge(): Promise<() => void> {
  return Promise.resolve(() => undefined);
}

export async function fixtureGetRuntimeInfo(): Promise<RuntimeInfo> {
  return {
    runtime: "browser-fixture",
    version: "dev"
  };
}

export async function fixtureGetAppBootstrap(): Promise<AppBootstrap> {
  const settingsRaw = localStorage.getItem(BROWSER_SETTINGS_KEY);
  const userRaw = localStorage.getItem(BROWSER_USER_KEY);
  const settings = settingsRaw ? (JSON.parse(settingsRaw) as AppSettings) : null;
  const user = userRaw ? (JSON.parse(userRaw) as UserInfo) : null;

  return {
    settings,
    resolvedSyncRoot: settings?.syncRoot ?? null,
    user,
    connectionValidation: settings ? buildFixtureValidation(user) : null,
    spaces: settings ? FIXTURE_SPACES : []
  };
}

export async function fixtureSaveAppSettings(settings: AppSettings): Promise<AppSettings> {
  localStorage.setItem(BROWSER_SETTINGS_KEY, JSON.stringify(settings));
  return settings;
}

export async function fixtureBeginUserAuthorization(redirectUri: string): Promise<string> {
  return redirectUri;
}

export async function fixtureCompleteUserAuthorization(
  code: string
): Promise<ConnectionCheckResult> {
  const user = { name: "模拟登录用户", avatar: "", userId: "browser-user" };
  const result: ConnectionCheckResult = {
    user,
    spaces: FIXTURE_SPACES,
    validation: buildFixtureValidation(user, code)
  };
  localStorage.setItem(BROWSER_USER_KEY, JSON.stringify(user));
  return result;
}

export async function fixtureValidateFeishuConnection(): Promise<ConnectionCheckResult> {
  const userRaw = localStorage.getItem(BROWSER_USER_KEY);
  const user = userRaw ? (JSON.parse(userRaw) as UserInfo) : null;
  return {
    user,
    spaces: user ? FIXTURE_SPACES : [],
    validation: buildFixtureValidation(user)
  };
}

export async function fixtureLogoutUser(): Promise<void> {
  localStorage.removeItem(BROWSER_USER_KEY);
}

export async function fixtureGetSyncTasks(): Promise<SyncTask[]> {
  return getBrowserSyncTasks();
}

export async function fixtureListKnowledgeBaseNodes(
  spaceId: string,
  parentNodeToken?: string
): Promise<KnowledgeBaseNode[]> {
  return listBrowserKnowledgeBaseNodes(spaceId, parentNodeToken);
}

export async function fixtureCreateSyncTask(
  selectedSources: SyncScope[],
  outputPath: string
): Promise<SyncTask> {
  return createBrowserSyncTask(selectedSources, outputPath);
}

export async function fixtureStartSyncTask(taskId: string): Promise<void> {
  startBrowserSyncTask(taskId);
}

export async function fixtureRetryFailedTask(taskId: string): Promise<void> {
  retryBrowserFailedTask(taskId);
}

export async function fixtureResumeSyncTasks(): Promise<SyncTask[]> {
  return resumeBrowserSyncTasks();
}

export async function fixtureDeleteSyncTask(taskId: string): Promise<void> {
  deleteBrowserSyncTask(taskId);
}

export async function fixtureClearAllSyncTasks(): Promise<void> {
  clearBrowserAllSyncTasks();
}

export async function fixtureReadSyncedMarkdownPreview(): Promise<SyncedMarkdownPreviewPayload> {
  throw new Error("当前浏览器夹具运行时不支持读取本地同步文件");
}

export async function fixtureGetSyncedDocumentIds(): Promise<Set<string>> {
  return new Set();
}

export async function fixtureGetDocumentSyncStatuses(): Promise<Record<string, DocumentSyncStatus>> {
  return {};
}

export async function fixtureRemoveSyncedDocuments(): Promise<number> {
  return 0;
}

export async function fixturePrepareForceRepulledDocuments(): Promise<number> {
  return 0;
}

export async function fixtureCheckDocumentFreshness(): Promise<Record<string, DocumentFreshnessResult>> {
  return {};
}

export async function fixtureLoadFreshnessMetadata(): Promise<Record<string, DocumentFreshnessResult>> {
  return {};
}

export async function fixtureSaveFreshnessMetadata(): Promise<void> {
  return;
}

export async function fixtureAlignDocumentSyncVersions(
  metadata: Record<string, DocumentFreshnessResult>
): Promise<Record<string, DocumentFreshnessResult>> {
  return metadata;
}

export async function fixtureClearFreshnessMetadata(): Promise<void> {
  return;
}

export async function fixtureOpenWorkspaceFolder(): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "浏览器夹具运行时不支持打开本地路径" };
}
