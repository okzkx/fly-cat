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
