import { LogoutOutlined, UserOutlined } from "@ant-design/icons";
import { App as AntdApp, Avatar, ConfigProvider, Dropdown, Layout, Space, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import AuthPage from "@/components/AuthPage";
import BrandMark from "@/components/BrandMark";
import HomePage from "@/components/HomePage";
import SettingsPage from "@/components/SettingsPage";
import TaskListPage from "@/components/TaskListPage";
import "./styles.css";
import type { AppPage, AppSettings, ConnectionValidation, SyncTask, UserInfo } from "@/types/app";
import type { DocumentSyncStatus, KnowledgeBaseNode, KnowledgeBaseSpace, SyncScope } from "@/types/sync";
import { getEffectiveSelectedSources } from "@/utils/syncSelection";
import {
  createSyncTask,
  getAppBootstrap,
  getDocumentSyncStatuses,
  getRuntimeInfo,
  getSyncTasks,
  getSyncedDocumentIds,
  initializeTaskEventBridge,
  listKnowledgeBaseNodes,
  logoutUser,
  removeSyncedDocuments,
  resumeSyncTasks,
  saveAppSettings,
  startSyncTask,
  TASK_EVENTS
} from "@/utils/taskManager";
import { attachLoadedChildren, normalizeSelectedSources, toggleSourceSelection } from "@/utils/treeSelection";

const { Header, Content } = Layout;
const { Text } = Typography;

function buildSpaceScope(space: KnowledgeBaseSpace): SyncScope {
  return {
    kind: "space",
    spaceId: space.id,
    spaceName: space.name,
    title: space.name,
    displayPath: space.name,
    pathSegments: []
  };
}

function scopeExists(scope: SyncScope | null, spaces: KnowledgeBaseSpace[], loadedTrees: Record<string, KnowledgeBaseNode[]>): boolean {
  if (!scope) {
    return false;
  }
  if (scope.kind === "space") {
    return spaces.some((space) => space.id === scope.spaceId);
  }

  const stack = [...(loadedTrees[scope.spaceId] ?? [])];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    if (
      current.kind === scope.kind &&
      current.nodeToken === scope.nodeToken &&
      current.documentId === scope.documentId &&
      current.spaceId === scope.spaceId
    ) {
      return true;
    }
    stack.push(...(current.children ?? []));
  }
  return false;
}

export default function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<AppPage>("settings");
  const [authed, setAuthed] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [resolvedSyncRoot, setResolvedSyncRoot] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<KnowledgeBaseSpace[]>([]);
  const [selectedScope, setSelectedScope] = useState<SyncScope | null>(null);
  const [selectedSources, setSelectedSources] = useState<SyncScope[]>([]);
  const [loadedSpaceTrees, setLoadedSpaceTrees] = useState<Record<string, KnowledgeBaseNode[]>>({});
  const [tasks, setTasks] = useState<SyncTask[]>([]);
  const [connectionValidation, setConnectionValidation] = useState<ConnectionValidation | null>(null);
  const [downloadedDocumentIds, setDownloadedDocumentIds] = useState<Set<string>>(new Set());
  const [documentSyncStatuses, setDocumentSyncStatuses] = useState<Record<string, DocumentSyncStatus>>({});

  useEffect(() => {
    let disposeBridge: (() => void) | undefined;

    const refreshTasks = async (): Promise<void> => setTasks(await getSyncTasks());
    const handleRefreshTasks = (): void => {
      void refreshTasks();
    };

    void getRuntimeInfo();
    void getAppBootstrap().then(async (bootstrap) => {
      setSettings(bootstrap.settings);
      setResolvedSyncRoot(bootstrap.resolvedSyncRoot);
      setSpaces(bootstrap.spaces);
      setSelectedScope(bootstrap.spaces[0] ? buildSpaceScope(bootstrap.spaces[0]) : null);
      setSelectedSources([]);
      setUserInfo(bootstrap.user);
      setConnectionValidation(bootstrap.connectionValidation);
      setAuthed(Boolean(bootstrap.user));
      setCurrentPage(bootstrap.settings ? (bootstrap.user ? "home" : "auth") : "settings");
      if (bootstrap.user) {
        await resumeSyncTasks();
      }
      await refreshTasks();
    });

    void initializeTaskEventBridge().then((cleanup) => {
      disposeBridge = cleanup;
    });
    window.addEventListener(TASK_EVENTS.progress, handleRefreshTasks);
    window.addEventListener(TASK_EVENTS.statusChanged, handleRefreshTasks);
    window.addEventListener(TASK_EVENTS.completed, handleRefreshTasks);
    window.addEventListener(TASK_EVENTS.failed, handleRefreshTasks);
    return () => {
      disposeBridge?.();
      window.removeEventListener(TASK_EVENTS.progress, handleRefreshTasks);
      window.removeEventListener(TASK_EVENTS.statusChanged, handleRefreshTasks);
      window.removeEventListener(TASK_EVENTS.completed, handleRefreshTasks);
      window.removeEventListener(TASK_EVENTS.failed, handleRefreshTasks);
    };
  }, []);

  const syncTarget = useMemo(() => resolvedSyncRoot ?? settings?.syncRoot ?? "./synced-docs", [resolvedSyncRoot, settings]);
  const pageTitle = useMemo(() => {
    switch (currentPage) {
      case "settings":
        return "飞猫助手 - 设置";
      case "auth":
        return "飞猫助手 - 登录";
      case "tasks":
        return "飞猫助手 - 任务列表";
      default:
        return "飞猫助手";
    }
  }, [currentPage]);

  useEffect(() => {
    if (!selectedScope && spaces[0]) {
      setSelectedScope(buildSpaceScope(spaces[0]));
      return;
    }
    if (selectedScope && !scopeExists(selectedScope, spaces, loadedSpaceTrees)) {
      setSelectedScope(spaces[0] ? buildSpaceScope(spaces[0]) : null);
    }
  }, [loadedSpaceTrees, selectedScope, spaces]);

  useEffect(() => {
    setSelectedSources((current) => current.filter((source) => scopeExists(source, spaces, loadedSpaceTrees)));
  }, [loadedSpaceTrees, spaces]);

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  useEffect(() => {
    if (!syncTarget) {
      setDownloadedDocumentIds(new Set());
      setDocumentSyncStatuses({});
      return;
    }
    void getSyncedDocumentIds(syncTarget).then(setDownloadedDocumentIds);
    void getDocumentSyncStatuses(syncTarget).then(setDocumentSyncStatuses);
  }, [syncTarget]);

  useEffect(() => {
    if (!syncTarget) {
      return;
    }
    const refreshSyncStatuses = (): void => {
      void getDocumentSyncStatuses(syncTarget).then(setDocumentSyncStatuses);
    };
    window.addEventListener(TASK_EVENTS.progress, refreshSyncStatuses);
    window.addEventListener(TASK_EVENTS.completed, refreshSyncStatuses);
    window.addEventListener(TASK_EVENTS.failed, refreshSyncStatuses);
    return () => {
      window.removeEventListener(TASK_EVENTS.progress, refreshSyncStatuses);
      window.removeEventListener(TASK_EVENTS.completed, refreshSyncStatuses);
      window.removeEventListener(TASK_EVENTS.failed, refreshSyncStatuses);
    };
  }, [syncTarget]);

  const activeSyncTask = useMemo(() => {
    return tasks.find((task) => task.status === "syncing" || task.status === "pending") ?? null;
  }, [tasks]);

  const activeTaskSummary = useMemo(() => {
    const runningTask = tasks.find((task) => task.status === "syncing");
    if (runningTask) {
      return `正在同步... ${runningTask.progress}%`;
    }
    const pendingCount = tasks.filter((task) => task.status === "pending").length;
    if (pendingCount > 0) {
      return `${pendingCount} 个任务等待中`;
    }
    const failedCount = tasks.filter((task) => task.status === "partial-failed").length;
    if (failedCount > 0) {
      return `${failedCount} 个任务待重试`;
    }
    return "查看任务列表";
  }, [tasks]);

  const handleLogout = (): void => {
    void logoutUser().then(() => {
      setAuthed(false);
      setUserInfo(null);
      setConnectionValidation(null);
      setSelectedScope(null);
      setSelectedSources([]);
      setLoadedSpaceTrees({});
      setCurrentPage("auth");
    });
  };

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: handleLogout
    }
  ];

  return (
    <ConfigProvider>
      <AntdApp>
        <Layout style={{ minHeight: "100vh" }}>
          <Header
            data-tauri-drag-region
            style={{
              background: "#fff",
              borderBottom: "1px solid #f0f0f0",
              height: 76,
              padding: "14px 24px 0",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-start",
              position: "relative"
            }}
          >
            <Space size={10} align="center">
              <BrandMark size={30} />
              <Space size={8} align="baseline">
                <Text strong style={{ fontSize: 20, lineHeight: 1 }}>
                  飞猫助手
                </Text>
                <Text type="secondary" style={{ fontSize: 13, lineHeight: 1 }}>
                  FlyCat
                </Text>
              </Space>
            </Space>
            {userInfo && (
              <div style={{ position: "absolute", right: 24, top: 18 }}>
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                  <Space style={{ cursor: "pointer" }}>
                    <Avatar icon={<UserOutlined />} src={userInfo.avatar} />
                    <Text>{userInfo.name}</Text>
                  </Space>
                </Dropdown>
              </div>
            )}
          </Header>

          <Content style={{ padding: 24 }}>
            {currentPage === "settings" && (
              <SettingsPage
                initialSettings={settings}
                onSaved={(nextSettings) => {
                  void saveAppSettings(nextSettings).then((saved) => {
                    setSettings(saved);
                    setAuthed(false);
                    setUserInfo(null);
                    setSpaces([]);
                    setSelectedScope(null);
                    setSelectedSources([]);
                    setLoadedSpaceTrees({});
                    setConnectionValidation(null);
                    setCurrentPage("auth");
                    void getAppBootstrap().then((bootstrap) => setResolvedSyncRoot(bootstrap.resolvedSyncRoot));
                  });
                }}
              />
            )}

            {currentPage === "auth" && (
              <AuthPage
                validation={connectionValidation}
                onAuthorized={(result) => {
                  setConnectionValidation(result.validation);
                  setSpaces(result.spaces);
                  setSelectedScope(result.spaces[0] ? buildSpaceScope(result.spaces[0]) : null);
                  setSelectedSources([]);
                  setLoadedSpaceTrees({});
                  if (result.validation.usable && result.user) {
                    setAuthed(true);
                    setUserInfo(result.user);
                    setCurrentPage("home");
                  } else {
                    setAuthed(false);
                    setUserInfo(null);
                    setCurrentPage("auth");
                  }
                  void getAppBootstrap().then((bootstrap) => setResolvedSyncRoot(bootstrap.resolvedSyncRoot));
                }}
                onGoToSettings={() => setCurrentPage("settings")}
              />
            )}

            {currentPage === "home" && authed && (
              <HomePage
                spaces={spaces}
                selectedScope={selectedScope}
                selectedSources={selectedSources}
                loadedSpaceTrees={loadedSpaceTrees}
                syncRoot={syncTarget}
                connectionValidation={connectionValidation}
                downloadedDocumentIds={downloadedDocumentIds}
                documentSyncStatuses={documentSyncStatuses}
                activeSyncTask={activeSyncTask}
                onScopeChange={setSelectedScope}
                onToggleSource={async (scope, checked) => {
                  let replacedCrossSpaceSelection = false;
                  setSelectedSources((current) => {
                    const nextSelection = toggleSourceSelection(current, scope, checked);
                    replacedCrossSpaceSelection = nextSelection.replacedCrossSpaceSelection;
                    return nextSelection.sources;
                  });

                  return { replacedCrossSpaceSelection };
                }}
                onLoadTreeChildren={async (spaceId, parentNodeToken) => {
                  if (!parentNodeToken && loadedSpaceTrees[spaceId]) {
                    return;
                  }
                  const nodes = await listKnowledgeBaseNodes(spaceId, parentNodeToken);
                  setLoadedSpaceTrees((current) => ({
                    ...current,
                    [spaceId]: parentNodeToken
                      ? attachLoadedChildren(current[spaceId] ?? [], parentNodeToken, nodes)
                      : nodes
                  }));
                }}
                onOpenTasks={() => setCurrentPage("tasks")}
                activeTaskSummary={activeTaskSummary}
                onCreateTask={async () => {
                  const effectiveSelectedSources = getEffectiveSelectedSources(selectedScope, selectedSources);
                  if (effectiveSelectedSources.length === 0) {
                    return null;
                  }
                  const task = await createSyncTask(
                    selectedSources.length > 0 ? normalizeSelectedSources(selectedSources) : effectiveSelectedSources,
                    syncTarget
                  );
                  setTasks(await getSyncTasks());
                  startSyncTask(task.id);
                  return { task };
                }}
                onBatchDeleteCheckedSyncedDocuments={async (documentIds: string[]) => {
                  if (!syncTarget || documentIds.length === 0) {
                    return;
                  }
                  await removeSyncedDocuments(syncTarget, documentIds);
                  setDocumentSyncStatuses(await getDocumentSyncStatuses(syncTarget));
                }}
                onResyncDocumentScope={async (scope) => {
                  if (!syncTarget || !connectionValidation?.usable) {
                    return;
                  }
                  if (scope.documentId) {
                    await removeSyncedDocuments(syncTarget, [scope.documentId]);
                    setDocumentSyncStatuses(await getDocumentSyncStatuses(syncTarget));
                  }
                  const sources = normalizeSelectedSources([scope]);
                  if (sources.length === 0) {
                    return;
                  }
                  const task = await createSyncTask(sources, syncTarget);
                  setTasks(await getSyncTasks());
                  await startSyncTask(task.id);
                }}
              />
            )}

            {currentPage === "tasks" && authed && <TaskListPage onGoBack={() => setCurrentPage("home")} initialTasks={tasks} />}
          </Content>
        </Layout>
      </AntdApp>
    </ConfigProvider>
  );
}
