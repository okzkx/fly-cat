import { CloudSyncOutlined, FolderOpenOutlined, SyncOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Checkbox, Empty, Space, Tree, Typography } from "antd";
import type { DataNode } from "antd/es/tree";
import type { HomePageProps } from "@/types/app";
import { getHomePageEmptyState } from "@/utils/connectionValidation";

const { Text } = Typography;

function buildTreeData(spaces: HomePageProps["spaces"]): DataNode[] {
  return [
    {
      title: "知识库",
      key: "wiki-root",
      children: spaces.map((space) => ({
        title: space.name,
        key: space.id,
        isLeaf: true
      }))
    }
  ];
}

export default function HomePage({
  spaces,
  syncRoot,
  connectionValidation,
  onSpacesChange,
  onOpenTasks,
  activeTaskSummary,
  onCreateTask
}: HomePageProps): React.JSX.Element {
  const { message } = App.useApp();
  const checkedKeys = spaces.filter((space) => space.selected).map((space) => space.id);
  const emptyState = getHomePageEmptyState(connectionValidation, spaces.length);

  const toggleSpace = (spaceId: string, checked: boolean): void => {
    onSpacesChange(spaces.map((space) => (space.id === spaceId ? { ...space, selected: checked } : space)));
  };

  const handleStartSync = async (): Promise<void> => {
    const result = await onCreateTask();
    if (result) {
      message.success(`已创建同步任务：${result.task.name}`);
    } else {
      message.warning(spaces.length === 0 ? "当前没有可同步的知识空间" : "请至少选择一个知识库空间");
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span>知识库同步列表</span>
            <Button type="text" onClick={onOpenTasks}>
              {activeTaskSummary}
            </Button>
          </div>
        }
        extra={
          <Button type="primary" icon={<SyncOutlined />} disabled={spaces.length === 0} onClick={() => void handleStartSync()}>
            开始同步
          </Button>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div style={{ padding: 12, background: "#fafafa", borderRadius: 8, border: "1px solid #f0f0f0" }}>
            <Space>
              <FolderOpenOutlined />
              <Text>同步目录：{syncRoot}</Text>
            </Space>
          </div>

          {emptyState && (
            <Alert
              type="info"
              showIcon
              message={emptyState.title}
              description={emptyState.description}
            />
          )}

          {spaces.length > 0 ? (
            <Tree
              defaultExpandAll
              treeData={buildTreeData(spaces)}
              titleRender={(node) => {
                if (node.key === "wiki-root") {
                  return (
                    <Space>
                      <CloudSyncOutlined style={{ color: "#722ed1" }} />
                      <span>{String(node.title)}</span>
                    </Space>
                  );
                }
                const checked = checkedKeys.includes(String(node.key));
                return (
                  <Checkbox checked={checked} onChange={(event) => toggleSpace(String(node.key), event.target.checked)}>
                    {String(node.title)}
                  </Checkbox>
                );
              }}
            />
          ) : (
            <Empty description="暂无知识空间可供选择" />
          )}
        </Space>
      </Card>
    </Space>
  );
}
