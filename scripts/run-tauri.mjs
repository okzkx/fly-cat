import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const tauriBinary = process.platform === "win32"
  ? join(projectRoot, "node_modules", ".bin", "tauri.cmd")
  : join(projectRoot, "node_modules", ".bin", "tauri");
const preferredDevPort = 1430;
const maxDevPortAttempts = 20;
const args = process.argv.slice(2);

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
  const child = spawn(tauriBinary, extraArgs, {
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

  const child = spawn(tauriBinary, ["dev", "--config", overridePath, ...args.slice(1)], {
    cwd: projectRoot,
    env: { ...process.env, FLYCAT_DEV_PORT: String(devPort) },
    stdio: "inherit",
    shell: false,
  });

  const cleanup = async () => {
    await rm(overridePath, { force: true }).catch(() => {});
  };

  child.on("exit", async (code, signal) => {
    await cleanup();

    if (signal) {
      process.kill(process.pid, signal);
      return;
    }

    process.exit(code ?? 1);
  });

  child.on("error", async (error) => {
    await cleanup();
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

void main();
