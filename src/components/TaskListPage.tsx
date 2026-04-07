import {
  ArrowLeftOutlined,
  ClearOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { Alert, App, Button, Card, Popconfirm, Progress, Space, Table, Tag, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { SyncTask, TaskListPageProps } from "@/types/app";
import {
  TASK_EVENTS,
  clearAllSyncTasks,
  deleteSyncTask,
  getSyncTasks,
  initializeTaskEventBridge,
  retryFailedTask,
  resumeSyncTasks
} from "@/utils/taskManager";
import { getFriendlyFailureSummary, parsePermissionFailure } from "@/utils/syncFailurePresentation";
import { buildSelectionSummary } from "@/utils/syncSelection";

const { Link, Paragraph, Text } = Typography;

function parseLegacySystemTime(value: string): Date | null {
  const match = value.match(/^SystemTime \{ intervals: (\d+) \}$/);
  if (!match) {
    return null;
  }
  const intervals = BigInt(match[1]);
  const unixIntervals = intervals - 116444736000000000n;
  if (unixIntervals < 0n) {
    return null;
  }
  const millis = Number(unixIntervals / 10000n);
  return Number.isFinite(millis) ? new Date(millis) : null;
}

function formatTaskTimestamp(value: string): string {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString("zh-CN");
  }
  const legacy = parseLegacySystemTime(value);
  if (legacy && !Number.isNaN(legacy.getTime())) {
    return legacy.toLocaleString("zh-CN");
  }
  return value;
}

function failureCategoryToTag(category: string): { color: string; text: string } {
  switch (category) {
    case "auth":
      return { color: "red", text: "授权" };
    case "discovery":
      return { color: "gold", text: "发现" };
    case "content-fetch":
    case "mcp":
      return { color: "orange", text: "内容抓取" };
    case "markdown-render":
    case "transform":
      return { color: "geekblue", text: "Markdown 渲染" };
    case "image-resolution":
      return { color: "purple", text: "图片处理" };
    case "filesystem-write":
    case "filesystem":
      return { color: "cyan", text: "文件写入" };
    default:
      return { color: "default", text: category };
  }
}

function statusToTag(status: SyncTask["status"], lifecycleState: SyncTask["lifecycleState"]): { color: string; text: string } {
  if (status === "syncing" && lifecycleState === "discovering") {
    return { color: "processing", text: "发现文档中" };
  }
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

function scopeLabel(task: SyncTask): string {
  const selectionSummary = task.selectionSummary ?? buildSelectionSummary(task.selectedSources ?? [], task.selectedScope);
  if (selectionSummary) {
    switch (selectionSummary.kind) {
      case "multi-document":
        return selectionSummary.includesDescendants
          ? `多个文档分支: ${selectionSummary.spaceName}（${selectionSummary.documentCount} 篇文档）`
          : `多篇文档: ${selectionSummary.spaceName}（${selectionSummary.documentCount} 篇）`;
      case "multi-source":
        return `多个同步根: ${selectionSummary.spaceName}（覆盖 ${selectionSummary.documentCount} 篇文档）`;
      case "document":
        return selectionSummary.includesDescendants
          ? `文档分支: ${selectionSummary.displayPath}`
          : `文档: ${selectionSummary.displayPath}`;
      case "folder":
        return `目录: ${selectionSummary.displayPath}`;
      default:
        return `知识库: ${selectionSummary.displayPath}`;
    }
  }
  if (!task.selectedScope) {
    return task.selectedSpaces.join(", ") || "未记录范围";
  }
  switch (task.selectedScope.kind) {
    case "document":
      return `文档: ${task.selectedScope.displayPath}`;
    case "folder":
      return `目录: ${task.selectedScope.displayPath}`;
    default:
      return `知识库: ${task.selectedScope.displayPath}`;
  }
}

export default function TaskListPage({ onGoBack, initialTasks }: TaskListPageProps): React.JSX.Element {
  const { message } = App.useApp();
  const [tasks, setTasks] = useState<SyncTask[]>(initialTasks ?? []);

  const runTaskAction = async (action: () => Promise<unknown>): Promise<boolean> => {
    try {
      await action();
      setTasks(await getSyncTasks());
      return true;
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      message.error(messageText || "任务操作失败，请重新登录后重试");
      return false;
    }
  };

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
            <Text type="secondary">{formatTaskTimestamp(record.createdAt)}</Text>
            <Text type="secondary">{scopeLabel(record)}</Text>
          </Space>
        )
      },
      {
        title: "进度",
        key: "progress",
        render: (_: unknown, record: SyncTask) => {
          if (record.status === "syncing" && record.lifecycleState === "discovering") {
            return <Progress percent={0} size="small" status="active" />;
          }
          return <Progress percent={record.progress} size="small" />;
        }
      },
      {
        title: "状态",
        key: "status",
        render: (_: unknown, record: SyncTask) => {
          const tag = statusToTag(record.status, record.lifecycleState);
          return <Tag color={tag.color}>{tag.text}</Tag>;
        }
      },
      {
        title: "统计",
        key: "counters",
        render: (_: unknown, record: SyncTask) => {
          if (record.status === "syncing" && record.lifecycleState === "discovering") {
            return <Text type="secondary">正在发现文档...</Text>;
          }
          return (
            <Space direction="vertical" size={2}>
              <Text>{`已处理 ${record.counters.processed} / 共 ${record.counters.total}`}</Text>
              <Text>{`${record.counters.succeeded} 成功 / ${record.counters.skipped} 跳过 / ${record.counters.failed} 失败`}</Text>
              {record.failureSummary && (
                <Text type="secondary">{record.failureSummary.message}</Text>
              )}
            </Space>
          );
        }
      },
      {
        title: "操作",
        key: "action",
        render: (_: unknown, record: SyncTask) => (
          <Space>
            {(record.status === "partial-failed" || record.status === "paused") && (
              <Button icon={<ReloadOutlined />} onClick={() => void runTaskAction(() => retryFailedTask(record.id))} />
            )}
            {record.status === "pending" && (
              <Button icon={<PlayCircleOutlined />} onClick={() => void runTaskAction(() => resumeSyncTasks())} />
            )}
            <Popconfirm title="确定删除这个同步任务吗？" onConfirm={() => void runTaskAction(() => deleteSyncTask(record.id))}>
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        )
      }
    ],
    [message, runTaskAction]
  );

  const hasPendingTasks = tasks.some((task) => task.status === "pending");

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card
        styles={{
          header: {
            alignItems: "stretch"
          },
          title: {
            flex: 1,
            minWidth: 0,
            overflow: "visible",
            whiteSpace: "normal"
          }
        }}
        title={
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              width: "100%",
              minWidth: 0
            }}
          >
            <Text strong style={{ fontSize: 16 }}>
              飞猫助手任务列表
            </Text>
            <Space wrap size={[8, 8]}>
              <Popconfirm
                title="确定清空所有同步任务吗？"
                description="仅移除任务记录，不会删除已同步到本地的文件。"
                disabled={tasks.length === 0}
                onConfirm={() =>
                  void runTaskAction(async () => {
                    await clearAllSyncTasks();
                  }).then((ok) => {
                    if (ok) {
                      message.success("已清空所有同步任务");
                    }
                  })
                }
              >
                <Button danger icon={<ClearOutlined />} disabled={tasks.length === 0}>
                  清空所有任务
                </Button>
              </Popconfirm>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                disabled={!hasPendingTasks}
                onClick={() => void runTaskAction(() => resumeSyncTasks())}
              >
                开始等待任务
              </Button>
              <Button icon={<ArrowLeftOutlined />} onClick={onGoBack}>
                返回首页
              </Button>
            </Space>
          </div>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={tasks}
          pagination={false}
          locale={{ emptyText: "暂无同步任务" }}
          expandable={{
            rowExpandable: (record) =>
              Boolean(record.selectedScope || record.selectionSummary || record.failureSummary || record.errors.length > 0),
            expandedRowRender: (record) => (
              <Space direction="vertical" size="middle" style={{ width: "100%" }}>
                <Text>同步范围：{scopeLabel(record)}</Text>
                {record.selectionSummary?.includesDescendants && record.selectionSummary.kind === "document" && (
                  <Text type="secondary">该文档分支共解析 {record.selectionSummary.documentCount} 篇文档。</Text>
                )}
                {record.selectionSummary?.kind === "folder" && record.selectionSummary.documentCount > 0 && (
                  <Text type="secondary">该目录子树共解析 {record.selectionSummary.documentCount} 篇文档。</Text>
                )}
                {(record.selectionSummary?.kind === "multi-document" || record.selectionSummary?.kind === "multi-source") && (
                  <Text type="secondary">
                    {record.selectionSummary.kind === "multi-source"
                      ? "已选同步根："
                      : record.selectionSummary.includesDescendants
                        ? "已选分支："
                        : "已选文档："}
                    {record.selectionSummary.previewPaths.join("；")}
                    {record.selectionSummary.documentCount > record.selectionSummary.previewPaths.length
                      ? ` 等 ${record.selectionSummary.documentCount} 篇文档`
                      : ""}
                  </Text>
                )}
                {record.failureSummary && (
                  <Alert
                    type="warning"
                    showIcon
                    message={`主要失败阶段：${failureCategoryToTag(record.failureSummary.category).text}`}
                    description={getFriendlyFailureSummary(record.failureSummary.category, record.failureSummary.message)}
                  />
                )}
                {record.errors.slice(0, 6).map((error, index) => {
                  const tag = failureCategoryToTag(error.category);
                  const permissionFailure = parsePermissionFailure(error.message);
                  return (
                    <Space key={`${record.id}-${error.documentId}-${index}`} direction="vertical" size={2} style={{ width: "100%" }}>
                      <Space wrap>
                        <Tag color={tag.color}>{tag.text}</Tag>
                        <Text strong>{error.title || error.documentId}</Text>
                      </Space>
                      {permissionFailure ? (
                        <Alert
                          type="error"
                          showIcon
                          message="缺少飞书文档读取权限"
                          description={
                            <Space direction="vertical" size={6} style={{ width: "100%" }}>
                              <Paragraph style={{ marginBottom: 0 }}>
                                当前飞书应用缺少读取文档详情所需的用户身份权限，因此同步在授权阶段被拦截。请先开通权限，再重新登录授权。
                              </Paragraph>
                              {permissionFailure.scopes.length > 0 && (
                                <Paragraph style={{ marginBottom: 0 }}>
                                  需要开通的权限：{permissionFailure.scopes.map((scope) => (
                                    <Tag key={`${error.documentId}-${scope}`} color="red" style={{ marginInlineEnd: 8 }}>
                                      {scope}
                                    </Tag>
                                  ))}
                                </Paragraph>
                              )}
                              {permissionFailure.applyUrl && (
                                <Paragraph style={{ marginBottom: 0 }}>
                                  权限申请链接：
                                  <Link href={permissionFailure.applyUrl} target="_blank" rel="noreferrer">
                                    {permissionFailure.applyUrl}
                                  </Link>
                                </Paragraph>
                              )}
                              <Text type="secondary">{error.message}</Text>
                            </Space>
                          }
                        />
                      ) : (
                        <Text type="secondary">{error.message}</Text>
                      )}
                    </Space>
                  );
                })}
                {record.errors.length > 6 && (
                  <Text type="secondary">仅展示前 6 条失败详情，共 {record.errors.length} 条。</Text>
                )}
              </Space>
            )
          }}
        />
      </Card>
    </Space>
  );
}
