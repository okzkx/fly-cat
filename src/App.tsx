import { LogoutOutlined, SyncOutlined, UserOutlined } from "@ant-design/icons";
import { App as AntdApp, Avatar, ConfigProvider, Dropdown, Layout, Space, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import AuthPage from "@/components/AuthPage";
import HomePage from "@/components/HomePage";
import SettingsPage from "@/components/SettingsPage";
import TaskListPage from "@/components/TaskListPage";
import "./styles.css";
import type { AppPage, AppSettings, SyncTask, UserInfo } from "@/types/app";
import type { KnowledgeBaseSpace } from "@/types/sync";
import {
  createSyncTask,
  getAppBootstrap,
  getRuntimeInfo,
  getSyncTasks,
  initializeTaskEventBridge,
  logoutUser,
  resumeSyncTasks,
  saveAppSettings,
  startSyncTask,
  TASK_EVENTS,
  validateFeishuConnection
} from "@/utils/taskManager";

const { Header, Content } = Layout;
const { Text } = Typography;

export default function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<AppPage>("settings");
  const [authed, setAuthed] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [spaces, setSpaces] = useState<KnowledgeBaseSpace[]>([]);
  const [tasks, setTasks] = useState<SyncTask[]>([]);

  useEffect(() => {
    let disposeBridge: (() => void) | undefined;

    const refreshTasks = async (): Promise<void> => setTasks(await getSyncTasks());
    const handleRefreshTasks = (): void => {
      void refreshTasks();
    };

    void getRuntimeInfo();
    void getAppBootstrap().then(async (bootstrap) => {
      setSettings(bootstrap.settings);
      setSpaces(bootstrap.spaces);
      setUserInfo(bootstrap.user);
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

  const syncTarget = useMemo(() => settings?.syncRoot ?? "./synced-docs", [settings]);

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
                    setCurrentPage("auth");
                  });
                }}
              />
            )}

            {currentPage === "auth" && (
              <AuthPage
                onAuthorized={async () => {
                  const user = await validateFeishuConnection();
                  setAuthed(true);
                  setUserInfo(user);
                  setSpaces((await getAppBootstrap()).spaces);
                  setCurrentPage("home");
                }}
                onGoToSettings={() => setCurrentPage("settings")}
              />
            )}

            {currentPage === "home" && authed && (
              <HomePage
                spaces={spaces}
                syncRoot={syncTarget}
                onSpacesChange={setSpaces}
                onOpenTasks={() => setCurrentPage("tasks")}
                activeTaskSummary={activeTaskSummary}
                onCreateTask={async () => {
                  const selectedSpaces = spaces.filter((space) => space.selected).map((space) => space.id);
                  if (selectedSpaces.length === 0) {
                    return null;
                  }
                  const task = await createSyncTask(selectedSpaces, syncTarget);
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
