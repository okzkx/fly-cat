import { describe, expect, it, vi } from "vitest";
import { createAndMaybeStartTask, startTaskNow } from "@/utils/syncTaskWorkflow";

describe("sync task workflow helpers", () => {
  it("adds the created task before awaiting direct start", async () => {
    const calls: string[] = [];
    const task = { id: "task-1" };
    const startTask = vi.fn(async (taskId: string) => {
      calls.push(`start:${taskId}`);
    });

    const created = await createAndMaybeStartTask({
      createTask: async () => {
        calls.push("create");
        return task;
      },
      onCreated: (createdTask) => {
        calls.push(`created:${createdTask.id}`);
      },
      startTask
    });

    expect(created).toBe(task);
    expect(calls).toEqual(["create", "created:task-1", "start:task-1"]);
    expect(startTask).toHaveBeenCalledOnce();
  });

  it("skips direct start when the caller queues the task", async () => {
    const startTask = vi.fn(async () => undefined);

    const created = await createAndMaybeStartTask({
      createTask: async () => ({ id: "task-queued" }),
      startTask,
      startImmediately: false
    });

    expect(created.id).toBe("task-queued");
    expect(startTask).not.toHaveBeenCalled();
  });

  it("starts the selected pending task by id", async () => {
    const startTask = vi.fn(async () => undefined);

    await startTaskNow("task-pending", startTask);

    expect(startTask).toHaveBeenCalledWith("task-pending");
    expect(startTask).toHaveBeenCalledOnce();
  });
});
