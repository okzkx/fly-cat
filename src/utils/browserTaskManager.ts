import type { SyncTask } from "@/types/app";
import type { SyncRunError } from "@/types/sync";

const TASK_STORAGE_KEY = "feishu_sync_tasks";

export const TASK_EVENTS = {
  progress: "sync-progress",
  statusChanged: "sync-status-changed",
  completed: "sync-task-completed",
  failed: "sync-task-failed"
} as const;

const runningTimers = new Map<string, number>();

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

export function createSyncTask(selectedSpaces: string[], outputPath: string): SyncTask {
  const task: SyncTask = {
    id: crypto.randomUUID(),
    name: `同步任务 - ${new Date().toLocaleString("zh-CN")}`,
    selectedSpaces,
    outputPath,
    status: "pending",
    progress: 0,
    counters: {
      total: Math.max(1, selectedSpaces.length * 3),
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
  if (task.selectedSpaces.includes("kb-product")) {
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
      const skipped = task.selectedSpaces.length > 1 ? 1 : 0;
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
