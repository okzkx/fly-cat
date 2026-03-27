import {
  CloudSyncOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  SyncOutlined,
  TableOutlined
} from "@ant-design/icons";
import { Alert, App, Button, Card, Empty, Space, Tag, Tree, Typography } from "antd";
import type { DataNode, EventDataNode } from "antd/es/tree";
import type { HomePageProps } from "@/types/app";
import type { KnowledgeBaseNode, KnowledgeBaseSpace, SyncScope } from "@/types/sync";
import { getHomePageEmptyState } from "@/utils/connectionValidation";
import { buildSelectionSummary, dedupeSelectedSources, getEffectiveSelectedSources, scopeKey } from "@/utils/syncSelection";

const { Text } = Typography;

type ScopeTreeDataNode = DataNode & {
  scopeValue?: SyncScope;
  spaceRef?: KnowledgeBaseSpace;
  nodeKind?: KnowledgeBaseNode["kind"] | "space";
  spaceId?: string;
  nodeToken?: string;
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

function buildNodeScope(node: KnowledgeBaseNode): SyncScope | undefined {
  if (node.kind === "bitable") {
    return undefined;
  }
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

function selectedKey(scope: SyncScope | null): string[] {
  if (!scope) {
    return [];
  }
  return [scopeKey(scope)];
}

function buildTreeNodes(nodes: KnowledgeBaseNode[]): ScopeTreeDataNode[] {
  return nodes.map((node) => ({
    title: node.title,
    key: node.key,
    isLeaf: !node.isExpandable,
    selectable: node.kind !== "bitable",
    disableCheckbox: node.kind !== "document",
    nodeKind: node.kind,
    spaceId: node.spaceId,
    nodeToken: node.nodeToken,
    scopeValue: buildNodeScope(node),
    children: node.children && node.children.length > 0 ? buildTreeNodes(node.children) : undefined
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
      disableCheckbox: true,
      children: spaces.map((space) => ({
        title: space.name,
        key: `space:${space.id}`,
        scopeValue: buildSpaceScope(space),
        spaceRef: space,
        nodeKind: "space",
        spaceId: space.id,
        disableCheckbox: true,
        children: loadedSpaceTrees[space.id] ? buildTreeNodes(loadedSpaceTrees[space.id]) : undefined
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

function getSelectionLabel(selectionSummary: ReturnType<typeof buildSelectionSummary>, selectedScope: SyncScope | null): string {
  if (!selectionSummary) {
    return "未选择";
  }
  switch (selectionSummary.kind) {
    case "multi-document":
      return "多篇文档";
    case "document":
      return "单个文档";
    case "folder":
      return "目录子树";
    case "space":
      return "整个知识库";
    default:
      return getScopeLabel(selectedScope);
  }
}

export default function HomePage({
  spaces,
  selectedScope,
  selectedDocumentSources,
  loadedSpaceTrees,
  syncRoot,
  connectionValidation,
  onScopeChange,
  onSelectedDocumentSourcesChange,
  onLoadTreeChildren,
  onOpenTasks,
  activeTaskSummary,
  onCreateTask
}: HomePageProps): React.JSX.Element {
  const { message } = App.useApp();
  const emptyState = getHomePageEmptyState(connectionValidation, spaces.length);
  const effectiveSelectedSources = getEffectiveSelectedSources(selectedScope, selectedDocumentSources);
  const selectionSummary = buildSelectionSummary(effectiveSelectedSources, selectedScope);

  const handleStartSync = async (): Promise<void> => {
    try {
      const result = await onCreateTask();
      if (result) {
        message.success(`已创建同步任务：${result.task.name}`);
      } else {
        message.warning(spaces.length === 0 ? "当前没有可同步的知识空间" : "请先选择一个同步范围或勾选文档");
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

  const checkedDocumentKeys = selectedDocumentSources.map((source) => scopeKey(source));

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
          <Button
            type="primary"
            icon={<SyncOutlined />}
            disabled={spaces.length === 0 || effectiveSelectedSources.length === 0}
            onClick={() => void handleStartSync()}
          >
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
                <Tag color="blue">{getSelectionLabel(selectionSummary, selectedScope)}</Tag>
                <Text>{selectionSummary?.displayPath ?? "请选择一个知识库、目录或文档"}</Text>
              </Space>
              {selectionSummary?.kind === "multi-document" && (
                <Space wrap>
                  <FileTextOutlined />
                  <Text>{selectionSummary.documentCount} 篇文档</Text>
                  <Text type="secondary">{selectionSummary.previewPaths.join("；")}</Text>
                </Space>
              )}
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
              checkable
              checkStrictly
              defaultExpandedKeys={["wiki-root"]}
              selectedKeys={selectedKey(selectedScope)}
              checkedKeys={{ checked: checkedDocumentKeys, halfChecked: [] }}
              treeData={treeData}
              loadData={async (treeNode) => {
                const node = treeNode as ScopeTreeDataNode;
                if (node.spaceRef && !loadedSpaceTrees[node.spaceRef.id]) {
                  await onLoadTreeChildren(node.spaceRef.id);
                  return;
                }
                if (!node.scopeValue || !node.spaceId || !node.nodeToken || node.children || node.isLeaf) {
                  return;
                }
                await onLoadTreeChildren(node.spaceId, node.nodeToken);
              }}
              onCheck={(_checkedKeys, info) => {
                const checkedNodes = dedupeSelectedSources(
                  info.checkedNodes
                    .map((checkedNode) => (checkedNode as ScopeTreeDataNode).scopeValue)
                    .filter((scope): scope is SyncScope => Boolean(scope && scope.kind === "document"))
                );
                const changedNode = info.node as ScopeTreeDataNode;
                const changedScope = changedNode.scopeValue;
                const selectedSpaces = new Set(checkedNodes.map((scope) => scope.spaceId));

                if (selectedSpaces.size > 1 && info.checked && changedScope?.kind === "document") {
                  message.warning("一次只能多选同一知识库内的文档，已切换到当前知识库。");
                  onSelectedDocumentSourcesChange([changedScope]);
                  return;
                }

                onSelectedDocumentSourcesChange(checkedNodes);
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
                const nodeKind = treeNode.nodeKind ?? scope?.kind ?? "space";
                const icon =
                  nodeKind === "document" ? (
                    <FileTextOutlined style={{ color: "#1677ff" }} />
                  ) : nodeKind === "folder" ? (
                    <FolderOutlined style={{ color: "#fa8c16" }} />
                  ) : nodeKind === "bitable" ? (
                    <TableOutlined style={{ color: "#13a8a8" }} />
                  ) : (
                    <CloudSyncOutlined style={{ color: "#722ed1" }} />
                  );

                return (
                  <Space>
                    {icon}
                    <span>{String(treeNode.title)}</span>
                    {nodeKind === "space" && <Tag color="purple">整库</Tag>}
                    {nodeKind === "folder" && <Tag color="gold">目录</Tag>}
                    {nodeKind === "document" && <Tag color="blue">文档</Tag>}
                    {nodeKind === "bitable" && <Tag color="cyan">多维表格</Tag>}
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
