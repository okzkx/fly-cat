import {
  CheckCircleOutlined,
  CloudSyncOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined,
  ExportOutlined,
  FileTextOutlined,
  FolderOpenOutlined,
  FolderOutlined,
  ReloadOutlined,
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
import {
  buildScopeFromNode,
  collectCoveredDescendantKeys,
  computeCascadedCheckedKeys,
  computeTriState
} from "@/utils/treeSelection";
import MarkdownPreviewPane from "@/components/MarkdownPreviewPane";
import { mapFolderPath } from "@/services/path-mapper";
import {
  alignDocumentSyncVersions,
  checkDocumentFreshness,
  isTauriRuntime,
  loadFreshnessMetadata,
  openDocumentInBrowser,
  openWorkspaceFolder,
  prepareForceRepulledDocuments,
  readSyncedMarkdownPreview,
  saveFreshnessMetadata
} from "@/utils/tauriRuntime";

const { Text } = Typography;

type BulkFreshnessAction = "refresh" | "force";

type ScopeTreeDataNode = DataNode & {
  scopeValue?: SyncScope;
  spaceRef?: KnowledgeBaseSpace;
  nodeKind?: KnowledgeBaseNode["kind"] | "space";
  spaceId?: string;
  nodeToken?: string;
  wikiListVersion?: string;
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
    const processed = activeTask?.counters.processed ?? 0;
    const total = activeTask?.counters.total ?? 0;
    return (
      <Tag color="processing" style={{ fontSize: 11, lineHeight: "18px", marginRight: 0 }}>
        同步中 {processed}/{total}
      </Tag>
    );
  }
  return <Tag style={{ fontSize: 11, lineHeight: "18px", marginRight: 0 }}>未同步</Tag>;
}

function DocumentFeishuRevisionLine({
  documentId,
  wikiListVersion,
  syncStatuses,
  freshnessMap
}: {
  documentId: string | undefined;
  wikiListVersion?: string;
  syncStatuses: Record<string, DocumentSyncStatus>;
  freshnessMap: Record<string, DocumentFreshnessResult>;
}): React.JSX.Element | null {
  if (Object.keys(syncStatuses).length === 0 || !documentId) {
    return null;
  }
  const sync = syncStatuses[documentId];
  const localRaw = sync?.localFeishuVersion?.trim();
  const local = localRaw && localRaw.length > 0 ? localRaw : "—";
  const fr = freshnessMap[documentId];
  const remoteFromFresh = fr?.remoteVersion?.trim();
  const remoteFromList = wikiListVersion?.trim();
  const remote =
    remoteFromFresh && remoteFromFresh.length > 0
      ? remoteFromFresh
      : remoteFromList && remoteFromList.length > 0
        ? remoteFromList
        : "—";
  return (
    <Text type="secondary" style={{ fontSize: 11, lineHeight: "18px", whiteSpace: "nowrap" }}>
      本地 {local} / 远端 {remote}
    </Text>
  );
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
    const hasLoadedSubtree = Boolean(treeNode.children && treeNode.children.length > 0);
    if (hasLoadedSubtree) {
      return (
        <AggregateSyncStatusTag
          treeNode={treeNode}
          syncStatuses={syncStatuses}
          syncingIds={syncingIds}
          activeTask={activeTask}
        />
      );
    }
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

function buildTreeNodes(
  nodes: KnowledgeBaseNode[],
  syncingKeys: Set<string>,
  syncedDocumentIds: Set<string>
): ScopeTreeDataNode[] {
  return nodes.map((node) => {
    const scopeValue = buildScopeFromNode(node) ?? undefined;
    const isSyncing = scopeValue ? syncingKeys.has(scopeKey(scopeValue)) : false;
    const docId = scopeValue?.documentId;
    const leafDoneEarly =
      (node.kind === "document" || node.kind === "bitable") && docId
        ? syncedDocumentIds.has(docId)
        : false;
    const disableCheckbox = isSyncing && !leafDoneEarly;

    return {
      title: node.title,
      key: node.key,
      isLeaf: !node.isExpandable,
      selectable: true,
      disableCheckbox,
      nodeKind: node.kind,
      spaceId: node.spaceId,
      nodeToken: node.nodeToken,
      wikiListVersion: node.wikiListVersion,
      hasChildren: node.hasChildren,
      isExpandable: node.isExpandable,
      scopeValue,
      children:
        node.children && node.children.length > 0
          ? buildTreeNodes(node.children, syncingKeys, syncedDocumentIds)
          : undefined
    };
  });
}

function buildTreeData(
  spaces: HomePageProps["spaces"],
  loadedSpaceTrees: HomePageProps["loadedSpaceTrees"],
  selectedSources: SyncScope[],
  syncingKeys: Set<string>,
  syncedDocumentIds: Set<string>
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
          ? buildTreeNodes(loadedSpaceTrees[space.id], syncingKeys, syncedDocumentIds)
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
  onCreateTask,
  onBatchDeleteCheckedSyncedDocuments,
  onReloadDocumentSyncStatuses,
  onResyncDocumentScope
}: HomePageProps): React.JSX.Element {
  const { message, modal } = App.useApp();
  const emptyState = getHomePageEmptyState(connectionValidation, spaces.length);
  const effectiveSelectedSources = getEffectiveSelectedSources(selectedScope, selectedSources);
  const selectionSummary = buildSelectionSummary(effectiveSelectedSources, selectedScope);
  const syncingIds = getSyncingDocumentIds(activeSyncTask);
  const canRunSync = Boolean(syncRoot) && connectionValidation?.usable === true;
  const syncTaskBusy =
    activeSyncTask?.status === "pending" || activeSyncTask?.status === "syncing";

  const [freshnessMap, setFreshnessMap] = useState<Record<string, DocumentFreshnessResult>>({});
  const [resyncingScopeKey, setResyncingScopeKey] = useState<string | null>(null);
  const [bulkFreshnessAction, setBulkFreshnessAction] = useState<BulkFreshnessAction | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewMarkdown, setPreviewMarkdown] = useState<string | null>(null);
  const [previewOutputPath, setPreviewOutputPath] = useState<string | null>(null);
  const [previewDisplayTitle, setPreviewDisplayTitle] = useState<string | null>(null);

  const allSyncedIdsForFreshness = useMemo(
    () =>
      Object.keys(documentSyncStatuses).filter((id) => documentSyncStatuses[id]?.status === "synced"),
    [documentSyncStatuses]
  );

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
    if (allSyncedIdsForFreshness.length === 0 || !syncRoot) {
      return;
    }

    // Debounce the freshness check to avoid too frequent API calls
    const timeoutId = setTimeout(() => {
      const checkFreshness = async () => {
        try {
          const result = await checkDocumentFreshness(allSyncedIdsForFreshness, syncRoot);
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
  }, [allSyncedIdsForFreshness, syncRoot]);

  useEffect(() => {
    if (!isTauriRuntime()) {
      setPreviewLoading(false);
      setPreviewError(null);
      setPreviewMarkdown(null);
      setPreviewOutputPath(null);
      setPreviewDisplayTitle(selectedScope?.title ?? null);
      return;
    }

    if (!syncRoot || !selectedScope) {
      setPreviewLoading(false);
      setPreviewError(null);
      setPreviewMarkdown(null);
      setPreviewOutputPath(null);
      setPreviewDisplayTitle(null);
      return;
    }

    setPreviewDisplayTitle(selectedScope.title);

    if (selectedScope.kind === "bitable") {
      setPreviewLoading(false);
      setPreviewMarkdown(null);
      setPreviewOutputPath(null);
      setPreviewError("多维表格等导出文件请直接在同步目录查看；此处仅支持 Markdown 文档预览。");
      return;
    }

    if (selectedScope.kind !== "document" || !selectedScope.documentId) {
      setPreviewLoading(false);
      setPreviewError(null);
      setPreviewMarkdown(null);
      setPreviewOutputPath(null);
      return;
    }

    const docId = selectedScope.documentId;
    const st = documentSyncStatuses[docId];
    if (!st || st.status !== "synced") {
      setPreviewLoading(false);
      setPreviewMarkdown(null);
      setPreviewOutputPath(null);
      setPreviewError("该文档尚未同步或本地文件不可用，请先同步后再预览。");
      return;
    }

    let cancelled = false;
    setPreviewLoading(true);
    setPreviewError(null);

    void readSyncedMarkdownPreview(syncRoot, docId)
      .then((res) => {
        if (cancelled) {
          return;
        }
        setPreviewMarkdown(res.markdown);
        setPreviewOutputPath(res.outputPath);
        setPreviewError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        const msg = err instanceof Error ? err.message : String(err);
        setPreviewMarkdown(null);
        setPreviewOutputPath(null);
        setPreviewError(msg || "加载预览失败");
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedScope, syncRoot, documentSyncStatuses]);

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

  const checkedSourceKeys = selectedSources.map((source) => scopeKey(source));

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

  /** Keys from selectedSources plus every loaded descendant covered by an ancestor scope (gou.md: checked parent ⇒ all children checked). */
  const expandedCheckedKeys = useMemo(() => {
    const set = new Set(checkedSourceKeys);
    for (const spaceId of Object.keys(loadedSpaceTrees)) {
      const tree = loadedSpaceTrees[spaceId];
      if (tree) {
        for (const k of collectCoveredDescendantKeys(tree, selectedSources)) {
          set.add(k);
        }
      }
    }
    return set;
  }, [checkedSourceKeys, loadedSpaceTrees, selectedSources]);

  const checkedSyncedDocumentIds = useMemo(() => {
    const docIds: string[] = [];
    for (const spaceId of Object.keys(loadedSpaceTrees)) {
      const tree = loadedSpaceTrees[spaceId];
      if (tree) {
        docIds.push(...collectDocumentIdsByTreeKeys(tree, expandedCheckedKeys));
      }
    }
    const unique = [...new Set(docIds)];
    return unique.filter((id) => syncedDocumentIds.has(id) && !syncingIds.has(id));
  }, [loadedSpaceTrees, expandedCheckedKeys, syncedDocumentIds, syncingIds]);

  // Build tree data once (needed for tri-state cascade logic)
  const treeData = useMemo(
    () => buildTreeData(spaces, loadedSpaceTrees, selectedSources, syncingKeys, syncedDocumentIds),
    [spaces, loadedSpaceTrees, selectedSources, syncingKeys, syncedDocumentIds]
  );

  // Compute half-checked keys for proper visual indeterminate display
  const halfCheckedKeys = useMemo(() =>
    computeHalfCheckedKeys(treeData, expandedCheckedKeys),
  [treeData, expandedCheckedKeys]);

  const handleStartSync = async (): Promise<void> => {
    try {
      const result = await onCreateTask();
      if (result?.task) {
        message.success(`已创建同步任务：${result.task.name}`);
      } else {
        message.warning(spaces.length === 0 ? "当前没有可同步的知识空间" : "请先选择一个同步范围或勾选目录、文档");
      }
    } catch (error) {
      const messageText = error instanceof Error ? error.message : String(error);
      message.error(messageText || "同步任务创建失败，请重新登录后重试");
    }
  };

  const handleBulkFreshnessAction = async (action: BulkFreshnessAction): Promise<void> => {
    if (!syncRoot || checkedSyncedDocumentIds.length === 0) {
      return;
    }
    if (bulkFreshnessAction !== null) {
      return;
    }
    setBulkFreshnessAction(action);
    try {
      if (action === "force") {
        if (syncTaskBusy) {
          message.error("已有同步任务进行中，请等待结束后再使用强制更新");
          return;
        }
        await prepareForceRepulledDocuments(syncRoot, checkedSyncedDocumentIds);
      }
      const result = await checkDocumentFreshness(checkedSyncedDocumentIds, syncRoot);
      const alignedResult = await alignDocumentSyncVersions(syncRoot, result, action === "force");
      setFreshnessMap((current) => ({ ...current, ...alignedResult }));
      await saveFreshnessMetadata(syncRoot, alignedResult);
      await onReloadDocumentSyncStatuses();
      if (action === "force") {
        if (effectiveSelectedSources.length === 0) {
          message.warning(
            "已删除所选文档的本地文件并更新元数据；请勾选同步范围后点击「开始同步」从远端拉取"
          );
          return;
        }
        const syncResult = await onCreateTask();
        if (syncResult?.task) {
          message.success(
            `已强制更新 ${checkedSyncedDocumentIds.length} 个所选文档：本地已清理并已创建同步任务`
          );
        } else {
          message.warning("本地已清理，但未能创建同步任务，请检查同步范围后重试");
        }
      } else {
        message.success(`已刷新 ${checkedSyncedDocumentIds.length} 个所选文档远端状态`);
      }
    } catch (error) {
      console.error("Failed to refresh all document freshness:", error);
      message.error("刷新远端状态失败，请检查网络或登录状态");
    } finally {
      setBulkFreshnessAction(null);
    }
  };

  const handleBatchDeleteSynced = (): void => {
    if (checkedSyncedDocumentIds.length === 0) {
      return;
    }
    modal.confirm({
      title: "批量删除本地已同步文档",
      content: `将从本地删除 ${checkedSyncedDocumentIds.length} 个已勾选且已同步的文档，删除后状态变为未同步。是否继续？`,
      okText: "删除",
      okType: "danger",
      cancelText: "取消",
      onOk: async () => {
        try {
          await onBatchDeleteCheckedSyncedDocuments(checkedSyncedDocumentIds);
          message.success("已删除所选已同步文档");
        } catch (error) {
          const messageText = error instanceof Error ? error.message : String(error);
          message.error(messageText || "批量删除失败");
        }
      }
    });
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

  const handleOpenFolderDefaultApp = async (scope: SyncScope): Promise<void> => {
    if (scope.kind !== "folder") {
      return;
    }
    if (!syncRoot) {
      message.warning("未设置同步目录");
      return;
    }
    const folderPath = mapFolderPath(syncRoot, scope.spaceName, scope.spaceId, scope.pathSegments);
    try {
      const result = await openWorkspaceFolder(folderPath);
      if (!result.success) {
        if (result.error?.includes("not found") || result.error?.includes("path not found")) {
          message.error("本地目录不存在，请先同步该目录");
        } else if (result.error?.includes("not a directory")) {
          message.error("目标路径不是目录");
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
    const currentState = computeTriState(expandedCheckedKeys, nodeKey, descendantKeys);
    const newCheckedKeys = computeCascadedCheckedKeys(expandedCheckedKeys, nodeKey, descendantKeys, currentState);

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
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 16,
        alignItems: "stretch",
        width: "100%"
      }}
    >
      <Card
        style={{ flex: "1 1 400px", minWidth: 280 }}
        styles={{
          header: {
            flexDirection: "column",
            alignItems: "stretch",
            gap: 12
          },
          title: {
            flex: "none",
            width: "100%",
            minWidth: 0,
            overflow: "visible",
            whiteSpace: "normal"
          },
          extra: {
            flexShrink: 0,
            marginInlineStart: 0,
            width: "100%",
            display: "flex",
            justifyContent: "flex-end",
            flexWrap: "wrap"
          }
        }}
        title={
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 12,
              minWidth: 0
            }}
          >
            <span>飞猫助手知识库同步</span>
            <Button
              type="text"
              onClick={onOpenTasks}
              data-testid="open-task-list"
              style={{ whiteSpace: "normal", height: "auto", textAlign: "start" }}
            >
              {activeTaskSummary}
            </Button>
          </div>
        }
        extra={
          <Space wrap size={[8, 8]}>
            <Button
              icon={<ReloadOutlined />}
              disabled={!canRunSync || checkedSyncedDocumentIds.length === 0 || bulkFreshnessAction !== null}
              loading={bulkFreshnessAction === "refresh"}
              data-testid="refresh-all-freshness"
              onClick={() => void handleBulkFreshnessAction("refresh")}
            >
              全部刷新
            </Button>
            <Button
              icon={<ReloadOutlined />}
              disabled={
                !canRunSync ||
                checkedSyncedDocumentIds.length === 0 ||
                bulkFreshnessAction !== null ||
                syncTaskBusy
              }
              loading={bulkFreshnessAction === "force"}
              data-testid="force-update-selected-docs"
              onClick={() => void handleBulkFreshnessAction("force")}
            >
              强制更新
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              disabled={spaces.length === 0 || !canRunSync || checkedSyncedDocumentIds.length === 0}
              onClick={() => handleBatchDeleteSynced()}
            >
              批量删除
            </Button>
            <Button
              type="primary"
              icon={<SyncOutlined />}
              disabled={spaces.length === 0 || effectiveSelectedSources.length === 0}
              onClick={() => void handleStartSync()}
            >
              开始同步
            </Button>
          </Space>
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
              checkedKeys={{ checked: Array.from(expandedCheckedKeys), halfChecked: halfCheckedKeys }}
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
                  <Space size={4} wrap>
                    {icon}
                    <span data-testid={`tree-label-${String(treeNode.key)}`}>{String(treeNode.title)}</span>
                    {(nodeKind === "document" || nodeKind === "bitable") && (
                      <DocumentFeishuRevisionLine
                        documentId={treeNode.scopeValue?.documentId}
                        wikiListVersion={treeNode.wikiListVersion}
                        syncStatuses={documentSyncStatuses}
                        freshnessMap={freshnessMap}
                      />
                    )}
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
                    {(treeNode.nodeKind === "document" || treeNode.nodeKind === "bitable") && treeNode.scopeValue && (() => {
                      const scope = treeNode.scopeValue;
                      const sk = scopeKey(scope);
                      const docId = scope.documentId;
                      const resyncDisabled =
                        !canRunSync ||
                        (docId !== undefined && docId !== "" && syncingIds.has(docId)) ||
                        resyncingScopeKey === sk;
                      return (
                        <Tooltip title="重新同步">
                          <Button
                            type="text"
                            size="small"
                            icon={<ReloadOutlined style={{ fontSize: 12 }} />}
                            disabled={resyncDisabled}
                            loading={resyncingScopeKey === sk}
                            aria-label="重新同步"
                            onClick={(e) => {
                              e.stopPropagation();
                              setResyncingScopeKey(sk);
                              void (async () => {
                                try {
                                  await onResyncDocumentScope(scope);
                                  message.success("已开始重新同步");
                                } catch (err) {
                                  console.error(err);
                                  message.error("重新同步失败");
                                } finally {
                                  setResyncingScopeKey((current) => (current === sk ? null : current));
                                }
                              })();
                            }}
                            style={{ padding: "0 4px" }}
                          />
                        </Tooltip>
                      );
                    })()}
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
                    {treeNode.nodeKind === "folder" && treeNode.scopeValue && (
                      <Tooltip title="使用默认应用打开">
                        <Button
                          type="text"
                          size="small"
                          icon={<FolderOpenOutlined style={{ fontSize: 12 }} />}
                          aria-label="使用默认应用打开"
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleOpenFolderDefaultApp(treeNode.scopeValue!);
                          }}
                          style={{ padding: "0 4px" }}
                        />
                      </Tooltip>
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

      <div style={{ flex: "1 1 360px", minWidth: 280, maxWidth: "100%" }}>
        <MarkdownPreviewPane
          displayTitle={previewDisplayTitle}
          loading={previewLoading}
          error={previewError}
          markdown={previewMarkdown}
          mdOutputPath={previewOutputPath}
        />
      </div>
    </div>
  );
}
