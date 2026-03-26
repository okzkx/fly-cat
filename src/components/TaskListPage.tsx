import {
  ArrowLeftOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { App, Button, Card, Popconfirm, Progress, Space, Table, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { SyncTask, TaskListPageProps } from "@/types/app";
import {
  TASK_EVENTS,
  deleteSyncTask,
  getSyncTasks,
  initializeTaskEventBridge,
  retryFailedTask,
  resumeSyncTasks
} from "@/utils/taskManager";

const { Text } = Typography;

function statusToTag(status: SyncTask["status"]): { color: string; text: string } {
  switch (status) {
    case "syncing":
      return { color: "processing", text: "同步中" };
    case "completed":
      return { color: "success", text: "已完成" };
    case "partial-failed":
      return { color: "warning", text: "部分失败" };
    case "paused":
      return { color: "default", text: "已暂停" };
    default:
      return { color: "default", text: "准备中" };
  }
}

export default function TaskListPage({ onGoBack }: TaskListPageProps): React.JSX.Element {
  const { message } = App.useApp();
  const [tasks, setTasks] = useState<SyncTask[]>([]);

  useEffect(() => {
    let disposeBridge: (() => void) | undefined;
    const refresh = async (): Promise<void> => setTasks(await getSyncTasks());
    void refresh();
    void initializeTaskEventBridge().then((cleanup) => {
      disposeBridge = cleanup;
    });

    const progressHandler = (): void => {
      void refresh();
    };
    const completeHandler = (event: Event): void => {
      const detail = (event as CustomEvent<{ task: SyncTask }>).detail;
      message.success(`任务完成：${detail.task.name}`);
      void refresh();
    };
    const failedHandler = (event: Event): void => {
      const detail = (event as CustomEvent<{ task: SyncTask }>).detail;
      message.warning(`任务有失败项：${detail.task.name}`);
      void refresh();
    };

    window.addEventListener(TASK_EVENTS.progress, progressHandler);
    window.addEventListener(TASK_EVENTS.statusChanged, progressHandler);
    window.addEventListener(TASK_EVENTS.completed, completeHandler);
    window.addEventListener(TASK_EVENTS.failed, failedHandler);

    return () => {
      disposeBridge?.();
      window.removeEventListener(TASK_EVENTS.progress, progressHandler);
      window.removeEventListener(TASK_EVENTS.statusChanged, progressHandler);
      window.removeEventListener(TASK_EVENTS.completed, completeHandler);
      window.removeEventListener(TASK_EVENTS.failed, failedHandler);
    };
  }, [message]);

  const columns = useMemo(
    () => [
      {
        title: "任务名称",
        dataIndex: "name",
        key: "name",
        render: (name: string, record: SyncTask) => (
          <Space direction="vertical" size={0}>
            <Text>{name}</Text>
            <Text type="secondary">{new Date(record.createdAt).toLocaleString("zh-CN")}</Text>
          </Space>
        )
      },
      {
        title: "输出目录",
        dataIndex: "outputPath",
        key: "outputPath"
      },
      {
        title: "进度",
        key: "progress",
        render: (_: unknown, record: SyncTask) => <Progress percent={record.progress} size="small" />
      },
      {
        title: "状态",
        key: "status",
        render: (_: unknown, record: SyncTask) => {
          const tag = statusToTag(record.status);
          return <Tag color={tag.color}>{tag.text}</Tag>;
        }
      },
      {
        title: "统计",
        key: "counters",
        render: (_: unknown, record: SyncTask) => (
          <Text>{`${record.counters.succeeded} 成功 / ${record.counters.skipped} 跳过 / ${record.counters.failed} 失败`}</Text>
        )
      },
      {
        title: "操作",
        key: "action",
        render: (_: unknown, record: SyncTask) => (
          <Space>
            {(record.status === "partial-failed" || record.status === "paused") && (
              <Button icon={<ReloadOutlined />} onClick={() => void retryFailedTask(record.id)} />
            )}
            {record.status === "pending" && <Button icon={<PlayCircleOutlined />} onClick={() => void resumeSyncTasks()} />}
            <Popconfirm title="确定删除这个同步任务吗？" onConfirm={() => void deleteSyncTask(record.id)}>
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ],
    []
  );

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card
        title="同步任务列表"
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={onGoBack}>
            返回首页
          </Button>
        }
      >
        <Table rowKey="id" columns={columns} dataSource={tasks} pagination={false} locale={{ emptyText: "暂无同步任务" }} />
      </Card>
    </Space>
  );
}
