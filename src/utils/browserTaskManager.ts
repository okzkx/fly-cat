import type { SyncTask } from "@/types/app";
import type { KnowledgeBaseNode, SyncRunError, SyncScope } from "@/types/sync";

const TASK_STORAGE_KEY = "feishu_sync_tasks";

export const TASK_EVENTS = {
  progress: "sync-progress",
  statusChanged: "sync-status-changed",
  completed: "sync-task-completed",
  failed: "sync-task-failed"
} as const;

const runningTimers = new Map<string, number>();

const SAMPLE_TREES: Record<string, KnowledgeBaseNode[]> = {
  "kb-eng": [
    {
      key: "folder:kb-eng:eng-guides",
      kind: "folder",
      spaceId: "kb-eng",
      spaceName: "研发知识库",
      title: "研发规范",
      displayPath: "研发知识库 / 研发规范",
      nodeToken: "eng-guides",
      pathSegments: ["研发规范"],
      hasChildren: true,
      isExpandable: true,
      children: [
        {
          key: "document:kb-eng:doc-eng-architecture",
          kind: "document",
          spaceId: "kb-eng",
          spaceName: "研发知识库",
          title: "研发架构设计",
          displayPath: "研发知识库 / 研发规范 / 研发架构设计",
          nodeToken: "node-doc-eng-architecture",
          documentId: "doc-eng-architecture",
          pathSegments: ["研发规范", "研发架构设计"],
          hasChildren: false,
          isExpandable: false
        },
        {
          key: "document:kb-eng:doc-eng-api",
          kind: "document",
          spaceId: "kb-eng",
          spaceName: "研发知识库",
          title: "研发API概览",
          displayPath: "研发知识库 / 研发规范 / 研发API概览",
          nodeToken: "node-doc-eng-api",
          documentId: "doc-eng-api",
          pathSegments: ["研发规范", "研发API概览"],
          hasChildren: false,
          isExpandable: false
        }
      ]
    }
  ],
  "kb-product": [
    {
      key: "folder:kb-product:product-library",
      kind: "folder",
      spaceId: "kb-product",
      spaceName: "产品知识库",
      title: "方案库",
      displayPath: "产品知识库 / 方案库",
      nodeToken: "product-library",
      pathSegments: ["方案库"],
      hasChildren: true,
      isExpandable: true,
      children: [
        {
          key: "document:kb-product:doc-product-overview",
          kind: "document",
          spaceId: "kb-product",
          spaceName: "产品知识库",
          title: "Product Overview",
          displayPath: "产品知识库 / 方案库 / Product Overview",
          nodeToken: "node-doc-product-overview",
          documentId: "doc-product-overview",
          pathSegments: ["方案库", "Product Overview"],
          hasChildren: false,
          isExpandable: false
        },
        {
          key: "document:kb-product:doc-product-roadmap",
          kind: "document",
          spaceId: "kb-product",
          spaceName: "产品知识库",
          title: "产品方案总览",
          displayPath: "产品知识库 / 方案库 / 产品方案总览",
          nodeToken: "node-doc-product-roadmap",
          documentId: "doc-product-roadmap",
          pathSegments: ["方案库", "产品方案总览"],
          hasChildren: true,
          isExpandable: true,
          children: [
            {
              key: "document:kb-product:doc-product-roadmap-h1",
              kind: "document",
              spaceId: "kb-product",
              spaceName: "产品知识库",
              title: "2026 H1 路线图",
              displayPath: "产品知识库 / 方案库 / 产品方案总览 / 2026 H1 路线图",
              nodeToken: "node-doc-product-roadmap-h1",
              documentId: "doc-product-roadmap-h1",
              pathSegments: ["方案库", "产品方案总览", "2026 H1 路线图"],
              hasChildren: false,
              isExpandable: false
            },
            {
              key: "bitable:kb-product:bitable-product-demand-pool",
              kind: "bitable",
              spaceId: "kb-product",
              spaceName: "产品知识库",
              title: "需求池",
              displayPath: "产品知识库 / 方案库 / 产品方案总览 / 需求池",
              nodeToken: "node-bitable-product-demand-pool",
              documentId: "bitable-product-demand-pool",
              pathSegments: ["方案库", "产品方案总览", "需求池"],
              hasChildren: false,
              isExpandable: false
            }
          ]
        }
      ]
    }
  ],
  "kb-ops": [
    {
      key: "document:kb-ops:doc-ops-playbook",
      kind: "document",
      spaceId: "kb-ops",
      spaceName: "运维知识库",
      title: "运维值班手册",
      displayPath: "运维知识库 / 运维值班手册",
      nodeToken: "node-doc-ops-playbook",
      documentId: "doc-ops-playbook",
      pathSegments: ["运维值班手册"],
      hasChildren: false,
      isExpandable: false
    }
  ]
};

function cloneCollapsedNodes(nodes: KnowledgeBaseNode[]): KnowledgeBaseNode[] {
  return nodes.map((node) => ({
    ...node,
    children: undefined
  }));
}

function findNodeByToken(nodes: KnowledgeBaseNode[], nodeToken: string): KnowledgeBaseNode | null {
  const stack = [...nodes];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    if (current.nodeToken === nodeToken) {
      return current;
    }
    stack.push(...(current.children ?? []));
  }
  return null;
}

function countDocuments(nodes: KnowledgeBaseNode[]): number {
  return nodes.reduce((total, node) => {
    const childTotal = node.children ? countDocuments(node.children) : 0;
    return total + (node.kind === "document" ? 1 : 0) + childTotal;
  }, 0);
}

function countScopeDocuments(scope: SyncScope): number {
  if (scope.kind === "document") {
    return 1;
  }

  const tree = SAMPLE_TREES[scope.spaceId] ?? [];
  if (scope.kind === "space") {
    return Math.max(1, countDocuments(tree));
  }

  const stack = [...tree];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    if (current.nodeToken === scope.nodeToken) {
      return Math.max(1, countDocuments([current]));
    }
    stack.push(...(current.children ?? []));
  }

  return 1;
}

function loadStoredTasks(): SyncTask[] {
  try {
    const raw = localStorage.getItem(TASK_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as SyncTask[];
  } catch {
    return [];
  }
}

function saveTasks(tasks: SyncTask[]): void {
  localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
}

function emitTaskEvent(name: string, task: SyncTask): void {
  window.dispatchEvent(new CustomEvent(name, { detail: { task } }));
}

function updateTask(taskId: string, updater: (task: SyncTask) => SyncTask): SyncTask | null {
  const tasks = loadStoredTasks();
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) {
    return null;
  }
  const nextTask = updater(tasks[index]);
  tasks[index] = nextTask;
  saveTasks(tasks);
  emitTaskEvent(TASK_EVENTS.statusChanged, nextTask);
  return nextTask;
}

export function getSyncTasks(): SyncTask[] {
  return loadStoredTasks().sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function listKnowledgeBaseNodes(spaceId: string, parentNodeToken?: string): KnowledgeBaseNode[] {
  const tree = SAMPLE_TREES[spaceId] ?? [];
  if (!parentNodeToken) {
    return cloneCollapsedNodes(tree);
  }

  const parent = findNodeByToken(tree, parentNodeToken);
  return cloneCollapsedNodes(parent?.children ?? []);
}

export function createSyncTask(selectedScope: SyncScope, outputPath: string): SyncTask {
  const task: SyncTask = {
    id: crypto.randomUUID(),
    name: `同步任务 - ${new Date().toLocaleString("zh-CN")}`,
    selectedSpaces: [selectedScope.spaceId],
    selectedScope,
    outputPath,
    status: "pending",
    progress: 0,
    counters: {
      total: countScopeDocuments(selectedScope),
      processed: 0,
      succeeded: 0,
      skipped: 0,
      failed: 0
    },
    lifecycleState: "idle",
    errors: [],
    failureSummary: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const tasks = getSyncTasks();
  tasks.unshift(task);
  saveTasks(tasks);
  emitTaskEvent(TASK_EVENTS.statusChanged, task);
  return task;
}

function buildSimulatedError(task: SyncTask): SyncRunError[] {
  if (task.selectedScope?.spaceId === "kb-product") {
    return [
      {
        documentId: "doc-product-overview",
        title: "Product Overview",
        category: "content-fetch",
        message: "远程文档内容获取超时"
      }
    ];
  }
  return [];
}

export function startSyncTask(taskId: string): void {
  const existingTimer = runningTimers.get(taskId);
  if (existingTimer) {
    window.clearInterval(existingTimer);
  }

  const started = updateTask(taskId, (task) => ({
    ...task,
    status: "syncing",
    lifecycleState: "syncing",
    updatedAt: new Date().toISOString()
  }));

  if (!started) {
    return;
  }

  emitTaskEvent(TASK_EVENTS.progress, started);

  const timer = window.setInterval(() => {
    const nextTask = updateTask(taskId, (task) => {
      const processed = Math.min(task.counters.total, task.counters.processed + 1);
      const progress = Math.round((processed / task.counters.total) * 100);
      const nextErrors = processed === task.counters.total ? buildSimulatedError(task) : task.errors;
      const failed = nextErrors.length;
      const skipped = task.selectedScope?.kind === "space" ? 1 : 0;
      const succeeded = Math.max(0, processed - failed - skipped);
      const failureSummary =
        nextErrors.length > 0
          ? {
              category: nextErrors[0].category,
              message: `本次失败主要发生在内容抓取阶段（${nextErrors.length}项）。${nextErrors[0].message}`,
              count: nextErrors.length
            }
          : null;

      return {
        ...task,
        progress,
        counters: {
          ...task.counters,
          processed,
          failed,
          skipped,
          succeeded
        },
        errors: nextErrors,
        failureSummary,
        updatedAt: new Date().toISOString()
      };
    });

    if (!nextTask) {
      window.clearInterval(timer);
      runningTimers.delete(taskId);
      return;
    }

    emitTaskEvent(TASK_EVENTS.progress, nextTask);

    if (nextTask.counters.processed >= nextTask.counters.total) {
      window.clearInterval(timer);
      runningTimers.delete(taskId);

      const finished = updateTask(taskId, (task) => ({
        ...task,
        status: task.errors.length > 0 ? "partial-failed" : "completed",
        lifecycleState: task.errors.length > 0 ? "partial-failed" : "completed",
        updatedAt: new Date().toISOString()
      }));

      if (finished) {
        emitTaskEvent(finished.errors.length > 0 ? TASK_EVENTS.failed : TASK_EVENTS.completed, finished);
      }
    }
  }, 700);

  runningTimers.set(taskId, timer);
}

export function retryFailedTask(taskId: string): void {
  const resetTask = updateTask(taskId, (task) => ({
    ...task,
    status: "pending",
    progress: 0,
    lifecycleState: "preparing",
    counters: {
      ...task.counters,
      processed: 0,
      failed: 0,
      succeeded: 0
    },
    errors: [],
    failureSummary: null,
    updatedAt: new Date().toISOString()
  }));

  if (resetTask) {
    startSyncTask(taskId);
  }
}

export function resumeSyncTasks(): SyncTask[] {
  const resumableTasks = getSyncTasks().filter((task) => task.status === "syncing" || task.status === "pending");
  resumableTasks.forEach((task) => startSyncTask(task.id));
  return resumableTasks;
}

export function deleteSyncTask(taskId: string): void {
  const existingTimer = runningTimers.get(taskId);
  if (existingTimer) {
    window.clearInterval(existingTimer);
    runningTimers.delete(taskId);
  }

  const tasks = getSyncTasks().filter((task) => task.id !== taskId);
  saveTasks(tasks);
}
