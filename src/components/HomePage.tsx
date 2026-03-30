import {
  CheckCircleOutlined,
  CloudSyncOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  SyncOutlined,
  TableOutlined
} from "@ant-design/icons";
import { Alert, App, Button, Card, Empty, Space, Tag, Tooltip, Tree, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import type { DataNode, EventDataNode } from "antd/es/tree";
import type { HomePageProps } from "@/types/app";
import type { DocumentFreshnessResult, DocumentSyncStatus, KnowledgeBaseNode, KnowledgeBaseSpace, SyncScope } from "@/types/sync";
import { getHomePageEmptyState } from "@/utils/connectionValidation";
import { buildSelectionSummary, getEffectiveSelectedSources, scopeKey } from "@/utils/syncSelection";
import { buildScopeFromNode, collectCoveredDescendantKeys, computeCascadedCheckedKeys, computeTriState } from "@/utils/treeSelection";
import { checkDocumentFreshness, loadFreshnessMetadata, openDocumentInBrowser, openWorkspaceFolder, saveFreshnessMetadata } from "@/utils/tauriRuntime";

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

function FreshnessIndicator({
  documentId,
  syncStatus,
  freshnessMap
}: {
  documentId: string | undefined;
  syncStatus: DocumentSyncStatus | undefined;
  freshnessMap: Record<string, DocumentFreshnessResult>;
}): React.JSX.Element | null {
  if (!documentId || !syncStatus || syncStatus.status !== "synced") {
    return null;
  }

  const freshness = freshnessMap[documentId];
  if (!freshness) {
    return null;
  }

  switch (freshness.status) {
    case "current":
      return (
        <Tooltip title="文档已是最新版本">
          <CheckCircleOutlined style={{ color: "#52c41a", marginLeft: 4, fontSize: 12 }} />
        </Tooltip>
      );
    case "updated":
      return (
        <Tooltip title={`有更新: 远程版本 ${freshness.remoteVersion}`}>
          <ExclamationCircleOutlined style={{ color: "#faad14", marginLeft: 4, fontSize: 12 }} />
        </Tooltip>
      );
    case "new":
      return (
        <Tooltip title="远程新增文档">
          <SyncOutlined style={{ color: "#1677ff", marginLeft: 4, fontSize: 12 }} />
        </Tooltip>
      );
    case "error":
      return (
        <Tooltip title={`检查失败: ${freshness.error || "未知错误"}`}>
          <ExclamationCircleOutlined style={{ color: "#ff4d4f", marginLeft: 4, fontSize: 12 }} />
        </Tooltip>
      );
    default:
      return null;
  }
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
  if (nodeKind === "document" || nodeKind === "bitable") {
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

/**
 * Collect document IDs for nodes matching treeKeys.
 * For folder nodes (without documentId), recursively collect all descendant document IDs.
 */
function collectDocumentIdsByTreeKeys(
  nodes: KnowledgeBaseNode[],
  treeKeys: Set<string>
): string[] {
  const docIds: string[] = [];

  function collectFromNode(node: KnowledgeBaseNode, shouldCollect: boolean): void {
    // If this node is in treeKeys or we're in a "collect all descendants" mode
    if (shouldCollect || treeKeys.has(node.key)) {
      // Collect this node's documentId if it has one
      if (node.documentId) {
        docIds.push(node.documentId);
      }
      // For folder nodes, collect all descendants
      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          collectFromNode(child, true);
        }
      }
    } else if (node.children && node.children.length > 0) {
      // Not in collect mode, but still need to check children
      for (const child of node.children) {
        collectFromNode(child, false);
      }
    }
  }

  for (const node of nodes) {
    collectFromNode(node, false);
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
      selectable: true,
      disableCheckbox: isDisabledNode || isSyncing,
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

/**
 * Collect all descendant keys from the built tree data (ScopeTreeDataNode).
 */
function collectTreeDataDescendantKeys(treeData: ScopeTreeDataNode[], targetKey: string): string[] {
  const result: string[] = [];
  let found = false;

  function walk(nodes: ScopeTreeDataNode[]): void {
    for (const node of nodes) {
      if (!found) {
        if (String(node.key) === targetKey) {
          found = true;
          addChildKeys(node.children);
          return;
        }
        if (node.children?.length) {
          walk(node.children);
        }
      }
    }
  }

  function addChildKeys(children: ScopeTreeDataNode[] | undefined): void {
    if (!children) return;
    for (const child of children) {
      result.push(String(child.key));
      addChildKeys(child.children);
    }
  }

  walk(treeData);
  return result;
}

/**
 * Compute half-checked keys for Ant Design Tree with checkStrictly.
 * A parent node is half-checked if it is not checked but has any checked descendant,
 * and it is not fully checked (not all descendants are checked and self is not checked).
 */
function computeHalfCheckedKeys(treeData: ScopeTreeDataNode[], checkedKeys: Set<string>): string[] {
  const halfChecked: string[] = [];

  // First pass: determine which nodes have any checked descendant
  const hasCheckedDescendant = new Set<string>();

  function markCheckedDescendants(nodes: ScopeTreeDataNode[]): boolean {
    let anyChecked = false;
    for (const node of nodes) {
      const key = String(node.key);
      const childHasChecked = node.children?.length ? markCheckedDescendants(node.children) : false;
      const selfOrChildChecked = checkedKeys.has(key) || childHasChecked;
      if (childHasChecked && !checkedKeys.has(key)) {
        // This node has checked descendants but is not itself checked -> half-checked
        halfChecked.push(key);
      }
      if (selfOrChildChecked) {
        anyChecked = true;
      }
    }
    return anyChecked;
  }

  markCheckedDescendants(treeData);
  return halfChecked;
}

/**
 * Find a ScopeTreeDataNode by its key in the tree data.
 */
function findNodeByKey(treeData: ScopeTreeDataNode[], targetKey: string): ScopeTreeDataNode | null {
  for (const node of treeData) {
    if (String(node.key) === targetKey) {
      return node;
    }
    if (node.children?.length) {
      const found = findNodeByKey(node.children, targetKey);
      if (found) return found;
    }
  }
  return null;
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
  const [freshnessMap, setFreshnessMap] = useState<Record<string, DocumentFreshnessResult>>({});

  // Load freshness metadata when sync root changes
  useEffect(() => {
    if (!syncRoot) {
      setFreshnessMap({});
      return;
    }

    const loadFreshness = async () => {
      try {
        const metadata = await loadFreshnessMetadata(syncRoot);
        setFreshnessMap(metadata);
      } catch (error) {
        console.error("Failed to load freshness metadata:", error);
      }
    };

    loadFreshness();
  }, [syncRoot]);

  // Check freshness for synced documents when they change
  useEffect(() => {
    const syncedIds = Object.keys(documentSyncStatuses).filter(
      (id) => documentSyncStatuses[id]?.status === "synced"
    );

    if (syncedIds.length === 0 || !syncRoot) {
      return;
    }

    // Debounce the freshness check to avoid too frequent API calls
    const timeoutId = setTimeout(() => {
      const checkFreshness = async () => {
        try {
          const result = await checkDocumentFreshness(syncedIds, syncRoot);
          setFreshnessMap(result);
          // Save to persistence
          await saveFreshnessMetadata(syncRoot, result);
        } catch (error) {
          console.error("Failed to check document freshness:", error);
        }
      };

      checkFreshness();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [syncRoot, documentSyncStatuses]);

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

  // Build tree data once (needed for tri-state cascade logic)
  const treeData = useMemo(() =>
    buildTreeData(spaces, loadedSpaceTrees, selectedSources, syncingKeys),
  [spaces, loadedSpaceTrees, selectedSources, syncingKeys]);

  // Compute half-checked keys for proper visual indeterminate display
  const halfCheckedKeys = useMemo(() =>
    computeHalfCheckedKeys(treeData, allCheckedKeys),
  [treeData, allCheckedKeys]);

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
      if (result?.cleanupOnly) {
        message.info(result.message || "已清理取消勾选的同步文档");
      } else if (result?.task) {
        message.success(`已创建同步任务：${result.task.name}`);
      } else {
        message.warning(spaces.length === 0 ? "当前没有可同步的知识空间" : "请先选择一个同步范围或勾选目录、文档");
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      message.error(messageText || "同步任务创建失败，请重新登录后重试");
    }
  };

  const handleOpenWorkspace = async (): Promise<void> => {
    if (!syncRoot) {
      message.warning("未设置同步目录");
      return;
    }
    try {
      const result = await openWorkspaceFolder(syncRoot);
      if (!result.success) {
        if (result.error?.includes("not found") || result.error?.includes("不存在")) {
          message.error("目录不存在，请先执行同步任务");
        } else if (result.error?.includes("permission") || result.error?.includes("权限")) {
          message.error("无法访问该目录，请检查权限");
        } else {
          message.error(result.error || "无法打开目录");
        }
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      message.error(messageText || "打开目录失败");
    }
  };

  const handleOpenInBrowser = async (
    nodeToken: string | undefined,
    documentId: string | undefined,
    kind: "document" | "bitable"
  ): Promise<void> => {
    try {
      const result = await openDocumentInBrowser({
        kind,
        nodeToken,
        documentId
      });
      if (!result.success) {
        message.error(result.error || "无法在浏览器中打开当前内容");
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      message.error(messageText || "打开浏览器失败");
    }
  };

  const handleTriStateToggle = (node: ScopeTreeDataNode): void => {
    if (!node.scopeValue || node.disableCheckbox) {
      return;
    }

    const nodeKey = String(node.key);
    const descendantKeys = collectTreeDataDescendantKeys(treeData, nodeKey);
    const currentState = computeTriState(allCheckedKeys, nodeKey, descendantKeys);
    const newCheckedKeys = computeCascadedCheckedKeys(allCheckedKeys, nodeKey, descendantKeys, currentState);

    // Determine which keys were added and removed
    const addedKeys = new Set<string>();
    const removedKeys = new Set<string>();
    for (const key of newCheckedKeys) {
      if (!allCheckedKeys.has(key)) {
        addedKeys.add(key);
      }
    }
    for (const key of allCheckedKeys) {
      if (!newCheckedKeys.has(key)) {
        removedKeys.add(key);
      }
    }

    // Update uncheckedSyncedDocKeys for cascaded changes
    if (addedKeys.size > 0 || removedKeys.size > 0) {
      setUncheckedSyncedDocKeys((prev) => {
        const next = new Set(prev);
        // Keys that are now checked should not be in unchecked set
        for (const key of addedKeys) {
          if (syncedDocTreeKeys.has(key)) {
            next.delete(key);
          }
        }
        // Keys that are now unchecked and are synced should be in unchecked set
        for (const key of removedKeys) {
          if (syncedDocTreeKeys.has(key)) {
            next.add(key);
          }
        }
        return next;
      });
    }

    // Synchronize highlight: checking also selects/highlights the node
    if (newCheckedKeys.has(nodeKey)) {
      onScopeChange(node.scopeValue);
    }

    // Update selectedSources to reflect the cascade
    if (currentState === "all-checked") {
      // Unchecking: remove self and all individually-selected descendants
      void onToggleSource(node.scopeValue, false).then(({ replacedCrossSpaceSelection }) => {
        if (replacedCrossSpaceSelection) {
          message.warning("一次只能在同一知识库内组合选择目录或文档，已切换到当前知识库。");
        }
      });
      // Also uncheck any individually-checked descendant sources
      for (const descendantKey of descendantKeys) {
        const descendantNode = findNodeByKey(treeData, descendantKey);
        if (descendantNode?.scopeValue && checkedSourceKeys.includes(descendantKey)) {
          void onToggleSource(descendantNode.scopeValue, false);
        }
      }
    } else {
      // Checking: toggle on self (covers descendants via includesDescendants)
      void onToggleSource(node.scopeValue, true).then(({ replacedCrossSpaceSelection }) => {
        if (replacedCrossSpaceSelection) {
          message.warning("一次只能在同一知识库内组合选择目录或文档，已切换到当前知识库。");
        }
      });
    }
  };

  const handleSelect = (_keys: React.Key[], info: { node: EventDataNode<DataNode> }): void => {
    const node = info.node as ScopeTreeDataNode;
    if (!node.scopeValue) {
      return;
    }
    onScopeChange(node.scopeValue);
    // Tri-state toggle on name click
    handleTriStateToggle(node);
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
                <Button
                  type="link"
                  size="small"
                  icon={<FolderOpenOutlined />}
                  onClick={() => void handleOpenWorkspace()}
                >
                  打开
                </Button>
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
              checkStrictly
              defaultExpandedKeys={["wiki-root"]}
              selectedKeys={selectedKey(selectedScope)}
              checkedKeys={{ checked: Array.from(allCheckedKeys), halfChecked: halfCheckedKeys }}
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
                handleTriStateToggle(changedNode);
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
                    <FreshnessIndicator
                      documentId={treeNode.scopeValue?.documentId}
                      syncStatus={documentSyncStatuses[treeNode.scopeValue?.documentId || ""]}
                      freshnessMap={freshnessMap}
                    />
                    {(treeNode.nodeKind === "document" || treeNode.nodeKind === "bitable") && treeNode.nodeToken && (
                      <Button
                        type="text"
                        size="small"
                        icon={<ExportOutlined style={{ fontSize: 12 }} />}
                        title="在浏览器打开"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleOpenInBrowser(
                            treeNode.nodeToken,
                            treeNode.scopeValue?.documentId,
                            treeNode.nodeKind === "bitable" ? "bitable" : "document"
                          );
                        }}
                        style={{ padding: "0 4px" }}
                      />
                    )}
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
