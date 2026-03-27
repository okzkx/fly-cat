import { EventEmitter } from "node:events";
import { describe, expect, it } from "vitest";

import {
  buildProcessTreeKillCommand,
  cleanupDevSession,
  resolveTauriInvocation
} from "../scripts/run-tauri.mjs";

describe("run-tauri wrapper", () => {
  it("resolves the tauri cli through the node entry script", () => {
    const invocation = resolveTauriInvocation("F:/repo", "C:/node.exe");

    expect(invocation.command).toBe("C:/node.exe");
    expect(invocation.args).toHaveLength(1);
    expect(invocation.args[0]).toMatch(/F:[\\/]+repo[\\/]node_modules[\\/]@tauri-apps[\\/]cli[\\/]tauri\.js$/);
  });

  it("builds a Windows process-tree cleanup command", () => {
    expect(buildProcessTreeKillCommand(4321, "win32")).toEqual({
      command: "taskkill",
      args: ["/PID", "4321", "/T", "/F"]
    });
    expect(buildProcessTreeKillCommand(4321, "darwin")).toBeNull();
  });

  it("cleans up the override file and terminates the Windows child tree", async () => {
    const rmCalls: Array<[string, { force: true }]> = [];
    const spawnCalls: Array<{ command: string; args: string[]; options: { stdio: "ignore"; shell: false } }> = [];
    const child = { pid: 4321 };
    const rmImpl = async (path: string, options: { force: true }) => {
      rmCalls.push([path, options]);
    };
    const spawnImpl = (command: string, spawnArgs: string[], options: { stdio: "ignore"; shell: false }) => {
      const emitter = new EventEmitter();
      spawnCalls.push({ command, args: spawnArgs, options });
      queueMicrotask(() => emitter.emit("exit", 0));
      return emitter;
    };

    await cleanupDevSession("override.json", child, {
      terminateChild: true,
      platform: "win32",
      rmImpl,
      spawnImpl
    });

    expect(spawnCalls).toEqual([
      {
        command: "taskkill",
        args: ["/PID", "4321", "/T", "/F"],
        options: { stdio: "ignore", shell: false }
      }
    ]);
    expect(rmCalls).toEqual([["override.json", { force: true }]]);
  });
});
