interface TaskWithId {
  id: string;
}

interface CreateAndMaybeStartOptions<TTask extends TaskWithId> {
  createTask: () => Promise<TTask>;
  onCreated?: (task: TTask) => void;
  startTask: (taskId: string) => Promise<void>;
  startImmediately?: boolean;
}

export async function createAndMaybeStartTask<TTask extends TaskWithId>({
  createTask,
  onCreated,
  startTask,
  startImmediately = true
}: CreateAndMaybeStartOptions<TTask>): Promise<TTask> {
  const task = await createTask();
  onCreated?.(task);
  if (startImmediately) {
    await startTask(task.id);
  }
  return task;
}

export async function startTaskNow(taskId: string, startTask: (taskId: string) => Promise<void>): Promise<void> {
  await startTask(taskId);
}
