import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const tauriCliScript = join(projectRoot, "node_modules", "@tauri-apps", "cli", "tauri.js");
const preferredDevPort = 1430;
const maxDevPortAttempts = 20;
const args = process.argv.slice(2);
const terminationSignals = ["SIGINT", "SIGTERM", "SIGBREAK"];

export function resolveTauriInvocation(
  root = projectRoot,
  nodeExecutable = process.execPath,
) {
  return {
    command: nodeExecutable,
    args: [root === projectRoot ? tauriCliScript : join(root, "node_modules", "@tauri-apps", "cli", "tauri.js")],
  };
}

export function buildProcessTreeKillCommand(pid, platform = process.platform) {
  if (!pid) {
    return null;
  }

  if (platform === "win32") {
    return {
      command: "taskkill",
      args: ["/PID", String(pid), "/T", "/F"],
    };
  }

  return null;
}

function onceAsync(fn) {
  let promise;

  return (...fnArgs) => {
    if (!promise) {
      promise = Promise.resolve(fn(...fnArgs));
    }

    return promise;
  };
}

function exitCodeForSignal(signal) {
  switch (signal) {
    case "SIGINT":
      return 130;
    case "SIGTERM":
      return 143;
    case "SIGBREAK":
      return 131;
    default:
      return 1;
  }
}

function waitForChildProcess(child) {
  return new Promise((resolveWait, rejectWait) => {
    child.once("exit", () => resolveWait());
    child.once("error", rejectWait);
  });
}

export async function terminateChildTree(
  child,
  { platform = process.platform, spawnImpl = spawn } = {},
) {
  if (!child?.pid) {
    return;
  }

  const killCommand = buildProcessTreeKillCommand(child.pid, platform);
  if (killCommand) {
    await new Promise((resolveKill) => {
      const killer = spawnImpl(killCommand.command, killCommand.args, {
        stdio: "ignore",
        shell: false,
      });

      killer.once("error", () => resolveKill());
      killer.once("exit", () => resolveKill());
    });
    return;
  }

  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }

  try {
    child.kill("SIGTERM");
    await waitForChildProcess(child).catch(() => {});
  } catch {
    // Ignore termination races during shutdown.
  }
}

export async function cleanupDevSession(
  overridePath,
  child,
  {
    terminateChild = false,
    platform = process.platform,
    rmImpl = rm,
    spawnImpl = spawn,
  } = {},
) {
  if (terminateChild) {
    await terminateChildTree(child, { platform, spawnImpl });
  }

  await rmImpl(overridePath, { force: true }).catch(() => {});
}

function probePort(port) {
  return new Promise((resolveProbe) => {
    const server = createServer();
    server.unref();
    server.once("error", () => resolveProbe(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolveProbe(true));
    });
  });
}

/**
 * Find the PID of the process occupying a given port on the local machine.
 * Returns null if the port is not in use or the PID cannot be determined.
 */
export async function findPortOwnerPid(
  port,
  { platform = process.platform, spawnImpl = spawn } = {},
) {
  if (platform === "win32") {
    try {
      const result = await new Promise((resolve, reject) => {
        const child = spawnImpl("netstat", ["-ano"], {
          stdio: ["ignore", "pipe", "pipe"],
          shell: false,
          encoding: "utf-8",
        });

        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (chunk) => { stdout += chunk; });
        child.stderr.on("data", (chunk) => { stderr += chunk; });
        child.on("error", reject);
        child.on("exit", (code) => {
          if (code === 0) { resolve(stdout); }
          else { reject(new Error(stderr || `netstat exited with code ${code}`)); }
        });
      });

      const pattern = new RegExp(`:\\s*${port}\\s+.*\\s+LISTENING\\s+(\\d+)\\s*$`, "m");
      const match = result.match(pattern);
      return match ? Number(match[1]) : null;
    } catch {
      return null;
    }
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const child = spawnImpl("lsof", ["-ti", `:${port}`], {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
        encoding: "utf-8",
      });

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("error", reject);
      child.on("exit", (code) => {
        if (code === 0) { resolve(stdout); }
        else { reject(new Error(stderr || `lsof exited with code ${code}`)); }
      });
    });

    const pid = result.trim();
    return pid ? Number(pid) : null;
  } catch {
    return null;
  }
}

/**
 * Check whether a given PID belongs to a Node.js process.
 * Returns true if the process name matches, false otherwise.
 */
export async function isNodeProcess(
  pid,
  { platform = process.platform, spawnImpl = spawn } = {},
) {
  if (!pid) {
    return false;
  }

  if (platform === "win32") {
    try {
      const result = await new Promise((resolve, reject) => {
        const child = spawnImpl("tasklist", ["/FI", `PID eq ${pid}`, "/FO", "CSV", "/NH"], {
          stdio: ["ignore", "pipe", "pipe"],
          shell: false,
          encoding: "utf-8",
        });

        let stdout = "";
        let stderr = "";
        child.stdout.on("data", (chunk) => { stdout += chunk; });
        child.stderr.on("data", (chunk) => { stderr += chunk; });
        child.on("error", reject);
        child.on("exit", (code) => {
          if (code === 0) { resolve(stdout); }
          else { reject(new Error(stderr || `tasklist exited with code ${code}`)); }
        });
      });

      return /node\.exe/i.test(result);
    } catch {
      return false;
    }
  }

  try {
    const result = await new Promise((resolve, reject) => {
      const child = spawnImpl("ps", ["-p", String(pid), "-o", "comm="], {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
        encoding: "utf-8",
      });

      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (chunk) => { stdout += chunk; });
      child.stderr.on("data", (chunk) => { stderr += chunk; });
      child.on("error", reject);
      child.on("exit", (code) => {
        if (code === 0) { resolve(stdout); }
        else { reject(new Error(stderr || `ps exited with code ${code}`)); }
      });
    });

    return /^node\b/.test(result.trim());
  } catch {
    return false;
  }
}

/**
 * Kill orphaned Node.js processes occupying ports in the dev port range.
 * Scans each port, checks if it's held by a Node process, and kills the tree if so.
 * Returns the number of processes killed.
 */
export async function killOrphanedDevProcesses(
  startPort,
  maxAttempts,
  { platform = process.platform, spawnImpl = spawn } = {},
) {
  let killed = 0;

  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const port = startPort + offset;

    if (await probePort(port)) {
      continue;
    }

    const pid = await findPortOwnerPid(port, { platform, spawnImpl });
    if (!pid) {
      continue;
    }

    const nodeOwned = await isNodeProcess(pid, { platform, spawnImpl });
    if (!nodeOwned) {
      continue;
    }

    const killCommand = buildProcessTreeKillCommand(pid, platform);
    if (!killCommand) {
      continue;
    }

    try {
      await new Promise((resolveKill) => {
        const killer = spawnImpl(killCommand.command, killCommand.args, {
          stdio: "ignore",
          shell: false,
        });

        killer.once("error", () => resolveKill());
        killer.once("exit", () => resolveKill());
      });

      console.log(`[flycat] Killed orphaned Node process (PID ${pid}) on port ${port}`);
      killed += 1;
    } catch {
      console.warn(`[flycat] Warning: failed to kill orphaned process on port ${port}`);
    }
  }

  return killed;
}

async function findAvailablePort(startPort, maxAttempts) {
  for (let offset = 0; offset < maxAttempts; offset += 1) {
    const port = startPort + offset;
    if (await probePort(port)) {
      return port;
    }
  }

  throw new Error(
    `Unable to find an available dev port in the localhost range ${startPort}-${startPort + maxAttempts - 1}.`,
  );
}

function spawnTauri(extraArgs, extraEnv = {}) {
  const tauriInvocation = resolveTauriInvocation();
  const child = spawn(tauriInvocation.command, [...tauriInvocation.args, ...extraArgs], {
    cwd: projectRoot,
    env: { ...process.env, ...extraEnv },
    stdio: "inherit",
    shell: false,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });

  child.on("error", (error) => {
    console.error("[flycat] Failed to start Tauri CLI:", error);
    process.exit(1);
  });
}

async function runDev() {
  await killOrphanedDevProcesses(preferredDevPort, maxDevPortAttempts);

  const devPort = await findAvailablePort(preferredDevPort, maxDevPortAttempts);
  const generatedDir = join(projectRoot, "scripts", ".generated");
  const overridePath = join(generatedDir, "tauri.dev.override.json");

  await mkdir(generatedDir, { recursive: true });
  await writeFile(
    overridePath,
    JSON.stringify(
      {
        build: {
          devUrl: `http://localhost:${devPort}`,
          beforeDevCommand: `npm run dev -- --port ${devPort}`,
        },
      },
      null,
      2,
    ),
  );

  console.log(`[flycat] Using localhost dev port ${devPort}`);

  const tauriInvocation = resolveTauriInvocation();
  const child = spawn(tauriInvocation.command, [...tauriInvocation.args, "dev", "--config", overridePath, ...args.slice(1)], {
    cwd: projectRoot,
    env: { ...process.env, FLYCAT_DEV_PORT: String(devPort) },
    stdio: "inherit",
    shell: false,
  });

  const cleanup = onceAsync((options = {}) => cleanupDevSession(overridePath, child, options));

  for (const signal of terminationSignals) {
    process.once(signal, () => {
      void cleanup({ terminateChild: true }).finally(() => {
        process.exit(exitCodeForSignal(signal));
      });
    });
  }

  child.on("exit", async (code, signal) => {
    await cleanup({ terminateChild: true });

    if (signal) {
      process.exit(exitCodeForSignal(signal));
    } else {
      process.exit(code ?? 1);
    }
  });

  child.on("error", async (error) => {
    await cleanup({ terminateChild: true });
    console.error("[flycat] Failed to start Tauri CLI:", error);
    process.exit(1);
  });
}

async function main() {
  if (args[0] === "dev") {
    try {
      await runDev();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[flycat] ${message} Please free one of the preferred localhost ports or adjust the wrapper script range.`,
      );
      process.exit(1);
    }
    return;
  }

  spawnTauri(args);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main();
}
