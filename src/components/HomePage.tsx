import {
  CloudSyncOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  SyncOutlined,
  TableOutlined
} from "@ant-design/icons";
import { Alert, App, Button, Card, Empty, Space, Tag, Tree, Typography } from "antd";
import { useMemo, useState } from "react";
import type { DataNode, EventDataNode } from "antd/es/tree";
import type { HomePageProps } from "@/types/app";
import type { DocumentSyncStatus, KnowledgeBaseNode, KnowledgeBaseSpace, SyncScope } from "@/types/sync";
import { getHomePageEmptyState } from "@/utils/connectionValidation";
import { buildSelectionSummary, getEffectiveSelectedSources, scopeKey } from "@/utils/syncSelection";
import { buildScopeFromNode, collectCoveredDescendantKeys } from "@/utils/treeSelection";

const { Text } = Typography;

type ScopeTreeDataNode = DataNode & {
  scopeValue?: SyncScope;
  spaceRef?: KnowledgeBaseSpace;
  nodeKind?: KnowledgeBaseNode["kind"] | "space";
  spaceId?: string;
  nodeToken?: string;
  hasChildren?: boolean;
  isExpandable?: boolean;
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

function getSyncingDocumentIds(
  task: HomePageProps["activeSyncTask"]
): Set<string> {
  if (!task || (task.status !== "syncing" && task.status !== "pending")) {
    return new Set();
  }
  if (task.discoveredDocumentIds && task.discoveredDocumentIds.length > 0) {
    return new Set(task.discoveredDocumentIds);
  }
  const ids = new Set<string>();
  for (const source of task.selectedSources ?? []) {
    if (source.documentId) {
      ids.add(source.documentId);
    }
  }
  return ids;
}

function formatSyncTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}-${day} ${hours}:${minutes}`;
  } catch {
    return "";
  }
}

function collectDescendantDocumentIds(node: ScopeTreeDataNode): string[] {
  const ids: string[] = [];
  if (node.scopeValue?.documentId) {
    ids.push(node.scopeValue.documentId);
  }
  if (node.children) {
    for (const child of node.children) {
      ids.push(...collectDescendantDocumentIds(child));
    }
  }
  return ids;
}

function AggregateSyncStatusTag({
  treeNode,
  syncStatuses,
  syncingIds,
  activeTask
}: {
  treeNode: ScopeTreeDataNode;
  syncStatuses: Record<string, DocumentSyncStatus>;
  syncingIds: Set<string>;
  activeTask: HomePageProps["activeSyncTask"];
}): React.JSX.Element | null {
  const docIds = collectDescendantDocumentIds(treeNode);
  if (docIds.length === 0) {
    return null;
  }
  const tagStyle = { fontSize: 11, lineHeight: "18px", marginRight: 0 };

  let synced = 0;
  let failed = 0;
  let syncing = false;
  for (const id of docIds) {
    if (syncingIds.has(id)) {
      syncing = true;
    }
    const status = syncStatuses[id];
    if (status?.status === "synced") {
      synced++;
    } else if (status?.status === "failed") {
      failed++;
    }
  }

  if (syncing) {
    const processed = activeTask?.counters.processed ?? 0;
    const total = activeTask?.counters.total ?? 0;
    return <Tag color="processing" style={tagStyle}>同步中 {processed}/{total}</Tag>;
  }
  if (synced === docIds.length) {
    return <Tag color="success" style={tagStyle}>全部已同步</Tag>;
  }
  if (synced > 0 || failed > 0) {
    return <Tag color={failed > 0 ? "warning" : "processing"} style={tagStyle}>{synced}/{docIds.length} 已同步</Tag>;
  }
  return <Tag style={tagStyle}>未同步</Tag>;
}

function DocumentSyncStatusTag({
  documentId,
  syncStatuses,
  syncingIds,
  activeTask
}: {
  documentId: string | undefined;
  syncStatuses: Record<string, DocumentSyncStatus>;
  syncingIds: Set<string>;
  activeTask: HomePageProps["activeSyncTask"];
}): React.JSX.Element | null {
  if (!documentId) {
    return null;
  }
  const mapped = syncStatuses[documentId];
  if (mapped) {
    if (mapped.status === "synced") {
      const time = formatSyncTime(mapped.lastSyncedAt);
      return <Tag color="success" style={{ fontSize: 11, lineHeight: "18px", marginRight: 0 }}>已同步 {time}</Tag>;
    }
    return <Tag color="error" style={{ fontSize: 11, lineHeight: "18px", marginRight: 0 }}>同步失败</Tag>;
  }
  if (syncingIds.has(documentId)) {
    return <Tag style={{ fontSize: 11, lineHeight: "18px", marginRight: 0 }}>等待同步</Tag>;
  }
  return <Tag style={{ fontSize: 11, lineHeight: "18px", marginRight: 0 }}>未同步</Tag>;
}

function NodeSyncStatusTag({
  treeNode,
  syncStatuses,
  syncingIds,
  activeTask
}: {
  treeNode: ScopeTreeDataNode;
  syncStatuses: Record<string, DocumentSyncStatus>;
  syncingIds: Set<string>;
  activeTask: HomePageProps["activeSyncTask"];
}): React.JSX.Element | null {
  const nodeKind = treeNode.nodeKind;
  if (!nodeKind || Object.keys(syncStatuses).length === 0) {
    return null;
  }
  if (nodeKind === "bitable") {
    return <Tag style={{ fontSize: 11, lineHeight: "18px", marginRight: 0 }}>不支持</Tag>;
  }
  if (nodeKind === "document") {
    return (
      <DocumentSyncStatusTag
        documentId={treeNode.scopeValue?.documentId}
        syncStatuses={syncStatuses}
        syncingIds={syncingIds}
        activeTask={activeTask}
      />
    );
  }
  return (
    <AggregateSyncStatusTag
      treeNode={treeNode}
      syncStatuses={syncStatuses}
      syncingIds={syncingIds}
      activeTask={activeTask}
    />
  );
}

function selectedKey(scope: SyncScope | null): string[] {
  if (!scope) {
    return [];
  }
  return [scopeKey(scope)];
}

function collectSyncedDocKeysFromTree(
  nodes: KnowledgeBaseNode[],
  syncedDocumentIds: Set<string>
): string[] {
  const keys: string[] = [];
  const stack = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }
    if (node.documentId && syncedDocumentIds.has(node.documentId)) {
      keys.push(node.key);
    }
    if (node.children && node.children.length > 0) {
      stack.push(...node.children);
    }
  }
  return keys;
}

function collectDocumentIdsByTreeKeys(
  nodes: KnowledgeBaseNode[],
  treeKeys: Set<string>
): string[] {
  const docIds: string[] = [];
  const stack = [...nodes];
  while (stack.length > 0) {
    const node = stack.pop();
    if (!node) {
      continue;
    }
    if (treeKeys.has(node.key) && node.documentId) {
      docIds.push(node.documentId);
    }
    if (node.children && node.children.length > 0) {
      stack.push(...node.children);
    }
  }
  return docIds;
}

function buildTreeNodes(nodes: KnowledgeBaseNode[], disabledKeys: Set<string>, syncingKeys: Set<string>): ScopeTreeDataNode[] {
  return nodes.map((node) => {
    const scopeValue = buildScopeFromNode(node) ?? undefined;
    const isDisabledNode = scopeValue ? disabledKeys.has(scopeKey(scopeValue)) : false;
    const isSyncing = scopeValue ? syncingKeys.has(scopeKey(scopeValue)) : false;

    return {
      title: node.title,
      key: node.key,
      isLeaf: !node.isExpandable,
      selectable: node.kind !== "bitable",
      disableCheckbox: node.kind === "bitable" || isDisabledNode || isSyncing,
      nodeKind: node.kind,
      spaceId: node.spaceId,
      nodeToken: node.nodeToken,
      hasChildren: node.hasChildren,
      isExpandable: node.isExpandable,
      scopeValue,
      children: node.children && node.children.length > 0 ? buildTreeNodes(node.children, disabledKeys, syncingKeys) : undefined
    };
  });
}

function buildTreeData(
  spaces: HomePageProps["spaces"],
  loadedSpaceTrees: HomePageProps["loadedSpaceTrees"],
  selectedSources: SyncScope[],
  syncingKeys: Set<string>
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
        children: loadedSpaceTrees[space.id]
          ? buildTreeNodes(
              loadedSpaceTrees[space.id],
              new Set(collectCoveredDescendantKeys(loadedSpaceTrees[space.id], selectedSources)),
              syncingKeys
            )
          : undefined
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
      return selectionSummary.includesDescendants ? "多个文档分支" : "多篇文档";
    case "multi-source":
      return "多个同步根";
    case "document":
      return selectionSummary.includesDescendants ? "文档分支" : "单个文档";
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
  selectedSources,
  loadedSpaceTrees,
  syncRoot,
  connectionValidation,
  downloadedDocumentIds,
  documentSyncStatuses,
  activeSyncTask,
  onScopeChange,
  onToggleSource,
  onLoadTreeChildren,
  onOpenTasks,
  activeTaskSummary,
  onCreateTask
}: HomePageProps): React.JSX.Element {
  const { message } = App.useApp();
  const emptyState = getHomePageEmptyState(connectionValidation, spaces.length);
  const effectiveSelectedSources = getEffectiveSelectedSources(selectedScope, selectedSources);
  const selectionSummary = buildSelectionSummary(effectiveSelectedSources, selectedScope);
  const syncingIds = getSyncingDocumentIds(activeSyncTask);

  const [uncheckedSyncedDocKeys, setUncheckedSyncedDocKeys] = useState<Set<string>>(new Set());

  // Collect document IDs that are already synced successfully
  const syncedDocumentIds = useMemo(() => {
    const ids = new Set<string>();
    for (const [docId, status] of Object.entries(documentSyncStatuses)) {
      if (status.status === "synced") {
        ids.add(docId);
      }
    }
    return ids;
  }, [documentSyncStatuses]);

  // Reset unchecked state when sync statuses change (e.g., after task completion)
  useMemo(() => {
    setUncheckedSyncedDocKeys(new Set());
  }, [documentSyncStatuses]);

  const checkedSourceKeys = selectedSources.map((source) => scopeKey(source));

  // Collect default checked keys from synced documents in the loaded trees
  const syncedDocTreeKeys = useMemo(() => {
    const keys: string[] = [];
    for (const spaceId of Object.keys(loadedSpaceTrees)) {
      const tree = loadedSpaceTrees[spaceId];
      if (tree) {
        keys.push(...collectSyncedDocKeysFromTree(tree, syncedDocumentIds));
      }
    }
    return new Set(keys);
  }, [loadedSpaceTrees, syncedDocumentIds]);

  // Build syncingKeys based on actual active task's discovered documents
  const syncingKeys = useMemo(() => {
    if (!activeSyncTask) {
      return new Set<string>();
    }
    const keys = new Set<string>();
    if (activeSyncTask.discoveredDocumentIds && activeSyncTask.discoveredDocumentIds.length > 0) {
      for (const spaceId of Object.keys(loadedSpaceTrees)) {
        const tree = loadedSpaceTrees[spaceId];
        if (tree) {
          const discoveredIds = new Set(activeSyncTask.discoveredDocumentIds);
          for (const key of collectSyncedDocKeysFromTree(tree, discoveredIds)) {
            keys.add(key);
          }
        }
      }
    } else {
      return new Set(checkedSourceKeys);
    }
    return keys;
  }, [activeSyncTask, loadedSpaceTrees, checkedSourceKeys]);

  // Merge user-checked keys with default synced document keys, minus unchecked
  const allCheckedKeys = useMemo(() => {
    const merged = new Set(checkedSourceKeys);
    for (const key of syncedDocTreeKeys) {
      if (!uncheckedSyncedDocKeys.has(key)) {
        merged.add(key);
      }
    }
    return merged;
  }, [checkedSourceKeys, syncedDocTreeKeys, uncheckedSyncedDocKeys]);

  // Compute unchecked synced document IDs for cleanup
  const uncheckedSyncedDocumentIds = useMemo(() => {
    if (uncheckedSyncedDocKeys.size === 0) {
      return [];
    }
    const docIds: string[] = [];
    for (const spaceId of Object.keys(loadedSpaceTrees)) {
      const tree = loadedSpaceTrees[spaceId];
      if (tree) {
        docIds.push(...collectDocumentIdsByTreeKeys(tree, uncheckedSyncedDocKeys));
      }
    }
    return docIds;
  }, [loadedSpaceTrees, uncheckedSyncedDocKeys]);

  const handleStartSync = async (): Promise<void> => {
    try {
      const result = await onCreateTask(uncheckedSyncedDocumentIds);
      if (result) {
        message.success(`已创建同步任务：${result.task.name}`);
      } else {
        message.warning(spaces.length === 0 ? "当前没有可同步的知识空间" : "请先选择一个同步范围或勾选目录、文档");
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      message.error(messageText || "同步任务创建失败，请重新登录后重试");
    }
  };

  const treeData = buildTreeData(spaces, loadedSpaceTrees, selectedSources, syncingKeys);

  const handleSelect = (_keys: React.Key[], info: { node: EventDataNode<DataNode> }): void => {
    const node = info.node as ScopeTreeDataNode;
    if (!node.scopeValue) {
      return;
    }
    onScopeChange(node.scopeValue);
    // Synchronize checkbox: click name toggles the box to match current checked state
    if (!node.disableCheckbox) {
      const nodeKey = String(node.key);
      const isChecked = allCheckedKeys.has(nodeKey);
      const shouldBeChecked = !isChecked;
      // Track unchecked synced documents (same logic as onCheck)
      if (syncedDocTreeKeys.has(nodeKey)) {
        setUncheckedSyncedDocKeys((prev) => {
          const next = new Set(prev);
          if (shouldBeChecked) {
            next.delete(nodeKey);
          } else {
            next.add(nodeKey);
          }
          return next;
        });
      }
      void onToggleSource(node.scopeValue, shouldBeChecked).then(({ replacedCrossSpaceSelection }) => {
        if (replacedCrossSpaceSelection) {
          message.warning("一次只能在同一知识库内组合选择目录或文档，已切换到当前知识库。");
        }
      });
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: "100%" }}>
      <Card
        title={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span>飞猫助手知识库同步</span>
            <Button type="text" onClick={onOpenTasks} data-testid="open-task-list">
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
                <Tag color="blue" data-testid="selection-kind">
                  {getSelectionLabel(selectionSummary, selectedScope)}
                </Tag>
                <Text data-testid="selection-display-path">
                  {selectionSummary?.displayPath ?? "请选择一个知识库、目录或文档"}
                </Text>
              </Space>
              {(selectionSummary?.kind === "multi-document" || selectionSummary?.kind === "multi-source") && (
                <Space wrap>
                  <FileTextOutlined />
                  <Text>
                    {selectionSummary.kind === "multi-source"
                      ? `${selectionSummary.rootCount ?? selectionSummary.previewPaths.length} 个同步根，覆盖 ${selectionSummary.documentCount} 篇文档`
                      : selectionSummary.includesDescendants
                      ? `${selectionSummary.rootCount ?? selectionSummary.previewPaths.length} 个文档分支`
                      : `${selectionSummary.documentCount} 篇文档`}
                  </Text>
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
            <div data-testid="knowledge-base-tree">
              <Tree
              checkable
              defaultExpandedKeys={["wiki-root"]}
              selectedKeys={selectedKey(selectedScope)}
              checkedKeys={{ checked: Array.from(allCheckedKeys), halfChecked: [] }}
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
                const changedNode = info.node as ScopeTreeDataNode;
                const changedScope = changedNode.scopeValue;
                if (!changedScope) {
                  return;
                }
                // Track unchecked synced documents
                const nodeKey = String(changedNode.key);
                if (syncedDocTreeKeys.has(nodeKey)) {
                  setUncheckedSyncedDocKeys((prev) => {
                    const next = new Set(prev);
                    if (info.checked) {
                      next.delete(nodeKey);
                    } else {
                      next.add(nodeKey);
                    }
                    return next;
                  });
                }
                // Synchronize highlight: checking checkbox also selects/highlights the node
                if (info.checked) {
                  onScopeChange(changedScope);
                }
                void onToggleSource(changedScope, info.checked).then(({ replacedCrossSpaceSelection }) => {
                  if (replacedCrossSpaceSelection) {
                    message.warning("一次只能在同一知识库内组合选择目录或文档，已切换到当前知识库。");
                  }
                });
              }}
              onSelect={handleSelect}
              titleRender={(node) => {
                const treeNode = node as ScopeTreeDataNode;
                if (treeNode.key === "wiki-root") {
                  return (
                    <Space>
                      <CloudSyncOutlined style={{ color: "#722ed1" }} />
                      <span data-testid={`tree-label-${String(treeNode.key)}`}>{String(treeNode.title)}</span>
                    </Space>
                  );
                }

                const nodeKind = treeNode.nodeKind ?? treeNode.scopeValue?.kind ?? "space";
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
                  <Space size={4}>
                    {icon}
                    <span data-testid={`tree-label-${String(treeNode.key)}`}>{String(treeNode.title)}</span>
                    <NodeSyncStatusTag
                      treeNode={treeNode}
                      syncStatuses={documentSyncStatuses}
                      syncingIds={syncingIds}
                      activeTask={activeSyncTask}
                    />
                  </Space>
                );
              }}
            />
            </div>
          ) : (
            <Empty description="暂无知识空间可供选择" />
          )}
        </Space>
      </Card>
    </Space>
  );
}
