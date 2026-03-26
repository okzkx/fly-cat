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
  getRuntimeInfo,
  getSyncTasks,
  initializeTaskEventBridge,
  resumeSyncTasks,
  startSyncTask,
  TASK_EVENTS
} from "@/utils/taskManager";

const mockSpaces: KnowledgeBaseSpace[] = [
  { id: "kb-eng", name: "研发知识库", selected: true },
  { id: "kb-product", name: "产品知识库", selected: false },
  { id: "kb-ops", name: "运维知识库", selected: false }
];

const { Header, Content } = Layout;
const { Text } = Typography;

export default function App(): React.JSX.Element {
  const [currentPage, setCurrentPage] = useState<AppPage>("settings");
  const [authed, setAuthed] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [spaces, setSpaces] = useState<KnowledgeBaseSpace[]>(mockSpaces);
  const [tasks, setTasks] = useState<SyncTask[]>([]);

  useEffect(() => {
    let disposeBridge: (() => void) | undefined;
    const storedSettings = localStorage.getItem("feishu_sync_settings");
    const storedUser = localStorage.getItem("feishu_sync_user");

    if (storedSettings) {
      setSettings(JSON.parse(storedSettings) as AppSettings);
      setCurrentPage(storedUser ? "home" : "auth");
    } else {
      setCurrentPage("settings");
    }

    if (storedUser) {
      setUserInfo(JSON.parse(storedUser) as UserInfo);
      setAuthed(true);
      void resumeSyncTasks();
    }

    const refreshTasks = async (): Promise<void> => setTasks(await getSyncTasks());
    const handleRefreshTasks = (): void => {
      void refreshTasks();
    };
    handleRefreshTasks();
    void getRuntimeInfo();
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
    localStorage.removeItem("feishu_sync_user");
    setAuthed(false);
    setUserInfo(null);
    setCurrentPage("auth");
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
                onSaved={(nextSettings) => {
                  setSettings(nextSettings);
                  setCurrentPage("auth");
                }}
              />
            )}

            {currentPage === "auth" && (
              <AuthPage
                onAuthorized={(user) => {
                  setAuthed(true);
                  setUserInfo(user);
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
