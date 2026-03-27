import { LogoutOutlined, SyncOutlined, UserOutlined } from "@ant-design/icons";
import { App as AntdApp, Avatar, ConfigProvider, Dropdown, Layout, Space, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import AuthPage from "@/components/AuthPage";
import HomePage from "@/components/HomePage";
import SettingsPage from "@/components/SettingsPage";
import TaskListPage from "@/components/TaskListPage";
import "./styles.css";
import type { AppPage, AppSettings, ConnectionValidation, SyncTask, UserInfo } from "@/types/app";
import type { KnowledgeBaseNode, KnowledgeBaseSpace, SyncScope } from "@/types/sync";
import { dedupeSelectedSources, getEffectiveSelectedSources } from "@/utils/syncSelection";
import {
  createSyncTask,
  getAppBootstrap,
  getRuntimeInfo,
  getSyncTasks,
  initializeTaskEventBridge,
  listKnowledgeBaseNodes,
  logoutUser,
  resumeSyncTasks,
  saveAppSettings,
  startSyncTask,
  TASK_EVENTS
} from "@/utils/taskManager";
import { attachLoadedChildren, mergeDocumentSubtreeSelection } from "@/utils/treeSelection";

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
  const [selectedDocumentSources, setSelectedDocumentSources] = useState<SyncScope[]>([]);
  const [loadedSpaceTrees, setLoadedSpaceTrees] = useState<Record<string, KnowledgeBaseNode[]>>({});
  const [tasks, setTasks] = useState<SyncTask[]>([]);
  const [connectionValidation, setConnectionValidation] = useState<ConnectionValidation | null>(null);

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
      setSelectedDocumentSources([]);
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
    setSelectedDocumentSources((current) => current.filter((source) => scopeExists(source, spaces, loadedSpaceTrees)));
  }, [loadedSpaceTrees, spaces]);

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

  const loadTreeBranch = async (spaceId: string, parentNodeToken?: string): Promise<KnowledgeBaseNode[]> => {
    const nodes = await listKnowledgeBaseNodes(spaceId, parentNodeToken);
    const resolvedNodes = await Promise.all(
      nodes.map(async (node) => {
        if (!node.isExpandable) {
          return node;
        }
        const children = await loadTreeBranch(spaceId, node.nodeToken);
        return {
          ...node,
          children
        };
      })
    );
    return resolvedNodes;
  };

  const handleLogout = (): void => {
    void logoutUser().then(() => {
      setAuthed(false);
      setUserInfo(null);
      setConnectionValidation(null);
      setSelectedScope(null);
      setSelectedDocumentSources([]);
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
              padding: "0 24px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              position: "relative"
            }}
          >
            <Space>
              <SyncOutlined style={{ color: "#1677ff" }} />
              <Text strong>飞书文档同步助手</Text>
            </Space>
            {userInfo && (
              <div style={{ position: "absolute", right: 24 }}>
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
                    setSelectedDocumentSources([]);
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
                  setSelectedDocumentSources([]);
                  setLoadedSpaceTrees({});
                  void getAppBootstrap().then((bootstrap) => setResolvedSyncRoot(bootstrap.resolvedSyncRoot));
                  if (result.validation.usable && result.user) {
                    setAuthed(true);
                    setUserInfo(result.user);
                    setCurrentPage("home");
                  } else {
                    setAuthed(false);
                    setUserInfo(null);
                    setCurrentPage("auth");
                  }
                }}
                onGoToSettings={() => setCurrentPage("settings")}
              />
            )}

            {currentPage === "home" && authed && (
              <HomePage
                spaces={spaces}
                selectedScope={selectedScope}
                selectedDocumentSources={selectedDocumentSources}
                loadedSpaceTrees={loadedSpaceTrees}
                syncRoot={syncTarget}
                connectionValidation={connectionValidation}
                onScopeChange={setSelectedScope}
                onSelectedDocumentSourcesChange={setSelectedDocumentSources}
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
                onSelectDocumentSubtree={async (scope) => {
                  if (scope.kind !== "document" || !scope.nodeToken) {
                    setSelectedDocumentSources((current) => dedupeSelectedSources([...current, scope]));
                    return 1;
                  }

                  const descendantNodes = await loadTreeBranch(scope.spaceId, scope.nodeToken);
                  setLoadedSpaceTrees((current) => ({
                    ...current,
                    [scope.spaceId]: attachLoadedChildren(current[scope.spaceId] ?? [], scope.nodeToken!, descendantNodes)
                  }));

                  const subtreeSelectionCount = mergeDocumentSubtreeSelection([], scope, descendantNodes).length;
                  setSelectedDocumentSources((current) => mergeDocumentSubtreeSelection(current, scope, descendantNodes));
                  return subtreeSelectionCount;
                }}
                onOpenTasks={() => setCurrentPage("tasks")}
                activeTaskSummary={activeTaskSummary}
                onCreateTask={async () => {
                  const selectedSources = getEffectiveSelectedSources(selectedScope, selectedDocumentSources);
                  if (selectedSources.length === 0) {
                    return null;
                  }
                  const task = await createSyncTask(selectedSources, syncTarget);
                  await startSyncTask(task.id);
                  setTasks(await getSyncTasks());
                  return { task };
                }}
              />
            )}

            {currentPage === "tasks" && authed && <TaskListPage onGoBack={() => setCurrentPage("home")} />}
          </Content>
        </Layout>
      </AntdApp>
    </ConfigProvider>
  );
}
