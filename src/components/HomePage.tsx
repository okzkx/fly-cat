import {
  CloudSyncOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  SyncOutlined
} from "@ant-design/icons";
import { Alert, App, Button, Card, Empty, Space, Tag, Tree, Typography } from "antd";
import type { DataNode, EventDataNode } from "antd/es/tree";
import type { HomePageProps } from "@/types/app";
import type { KnowledgeBaseNode, KnowledgeBaseSpace, SyncScope } from "@/types/sync";
import { getHomePageEmptyState } from "@/utils/connectionValidation";

const { Text } = Typography;

type ScopeTreeDataNode = DataNode & {
  scopeValue?: SyncScope;
  spaceRef?: KnowledgeBaseSpace;
  children?: ScopeTreeDataNode[];
};

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

function buildNodeScope(node: KnowledgeBaseNode): SyncScope {
  return {
    kind: node.kind,
    spaceId: node.spaceId,
    spaceName: node.spaceName,
    title: node.title,
    displayPath: node.displayPath,
    nodeToken: node.nodeToken,
    documentId: node.documentId,
    pathSegments: node.pathSegments
  };
}

function scopeKey(scope: SyncScope | null): string[] {
  if (!scope) {
    return [];
  }
  if (scope.kind === "space") {
    return [`space:${scope.spaceId}`];
  }
  if (scope.kind === "document" && scope.documentId) {
    return [`document:${scope.spaceId}:${scope.documentId}`];
  }
  return [`${scope.kind}:${scope.spaceId}:${scope.nodeToken ?? scope.title}`];
}

function buildTreeNodes(nodes: KnowledgeBaseNode[]): ScopeTreeDataNode[] {
  return nodes.map((node) => ({
    title: node.title,
    key: node.key,
    isLeaf: node.kind === "document",
    scopeValue: buildNodeScope(node),
    children: node.children ? buildTreeNodes(node.children) : undefined
  }));
}

function buildTreeData(
  spaces: HomePageProps["spaces"],
  loadedSpaceTrees: HomePageProps["loadedSpaceTrees"]
): ScopeTreeDataNode[] {
  return [
    {
      title: "知识库",
      key: "wiki-root",
      selectable: false,
      children: spaces.map((space) => ({
        title: space.name,
        key: `space:${space.id}`,
        scopeValue: buildSpaceScope(space),
        spaceRef: space,
        children: buildTreeNodes(loadedSpaceTrees[space.id] ?? [])
      }))
    }
  ];
}

function getScopeLabel(scope: SyncScope | null): string {
  if (!scope) {
    return "未选择";
  }
  switch (scope.kind) {
    case "document":
      return "单个文档";
    case "folder":
      return "目录子树";
    default:
      return "整个知识库";
  }
}

export default function HomePage({
  spaces,
  selectedScope,
  loadedSpaceTrees,
  syncRoot,
  connectionValidation,
  onScopeChange,
  onLoadSpaceTree,
  onOpenTasks,
  activeTaskSummary,
  onCreateTask
}: HomePageProps): React.JSX.Element {
  const { message } = App.useApp();
  const emptyState = getHomePageEmptyState(connectionValidation, spaces.length);

  const handleStartSync = async (): Promise<void> => {
    try {
      const result = await onCreateTask();
      if (result) {
        message.success(`已创建同步任务：${result.task.name}`);
      } else {
        message.warning(spaces.length === 0 ? "当前没有可同步的知识空间" : "请先选择一个同步范围");
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      message.error(messageText || "同步任务创建失败，请重新登录后重试");
    }
  };

  const treeData = buildTreeData(spaces, loadedSpaceTrees);

  const handleSelect = (_keys: React.Key[], info: { node: EventDataNode<DataNode> }): void => {
    const node = info.node as ScopeTreeDataNode;
    if (node.scopeValue) {
      onScopeChange(node.scopeValue);
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
          <Button type="primary" icon={<SyncOutlined />} disabled={spaces.length === 0 || !selectedScope} onClick={() => void handleStartSync()}>
            开始同步
          </Button>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div style={{ padding: 12, background: "#fafafa", borderRadius: 8, border: "1px solid #f0f0f0" }}>
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Space>
                <FolderOpenOutlined />
                <Text>实际写入目录：{syncRoot}</Text>
              </Space>
              <Space wrap>
                <FolderOpenOutlined />
                <Text>已选同步范围：</Text>
                <Tag color="blue">{getScopeLabel(selectedScope)}</Tag>
                <Text>{selectedScope?.displayPath ?? "请选择一个知识库、目录或文档"}</Text>
              </Space>
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
              selectedKeys={scopeKey(selectedScope)}
              treeData={treeData}
              loadData={async (treeNode) => {
                const node = treeNode as ScopeTreeDataNode;
                if (node.spaceRef && !loadedSpaceTrees[node.spaceRef.id]) {
                  await onLoadSpaceTree(node.spaceRef);
                }
              }}
              onSelect={handleSelect}
              titleRender={(node) => {
                const treeNode = node as ScopeTreeDataNode;
                if (treeNode.key === "wiki-root") {
                  return (
                    <Space>
                      <CloudSyncOutlined style={{ color: "#722ed1" }} />
                      <span>{String(treeNode.title)}</span>
                    </Space>
                  );
                }

                const scope = treeNode.scopeValue;
                const icon =
                  scope?.kind === "document" ? (
                    <FileTextOutlined style={{ color: "#1677ff" }} />
                  ) : scope?.kind === "folder" ? (
                    <FolderOutlined style={{ color: "#fa8c16" }} />
                  ) : (
                    <CloudSyncOutlined style={{ color: "#722ed1" }} />
                  );

                return (
                  <Space>
                    {icon}
                    <span>{String(treeNode.title)}</span>
                    {scope?.kind === "space" && <Tag color="purple">整库</Tag>}
                    {scope?.kind === "folder" && <Tag color="gold">目录</Tag>}
                    {scope?.kind === "document" && <Tag color="blue">文档</Tag>}
                  </Space>
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
