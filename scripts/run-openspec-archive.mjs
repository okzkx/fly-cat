import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { generateArchiveReport, resolveArchiveDir } from "./archive-report-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const archiveRoot = resolve(projectRoot, "openspec", "changes", "archive");
const args = process.argv.slice(2);

function getChangeName(argv) {
  return argv.find((value) => value && !value.startsWith("-")) ?? "";
}

async function runArchive(argv) {
  const command =
    process.platform === "win32"
      ? { file: "cmd.exe", args: ["/d", "/s", "/c", "openspec", "archive", ...argv] }
      : { file: "openspec", args: ["archive", ...argv] };
  const child = spawn(command.file, command.args, {
    cwd: projectRoot,
    env: process.env,
    shell: false,
    stdio: "inherit",
  });

  return new Promise((resolveExit, rejectExit) => {
    child.on("error", rejectExit);
    child.on("exit", (code) => resolveExit(code ?? 1));
  });
}

async function main() {
  const changeName = getChangeName(args);
  if (!changeName) {
    throw new Error("Please provide the change name when using the repository archive wrapper.");
  }

  const exitCode = await runArchive(args);
  if (exitCode !== 0) {
    process.exit(exitCode);
  }

  const archiveDir = await resolveArchiveDir({ archiveRoot, changeName });
  const outputPath = await generateArchiveReport(archiveDir);
  console.log(`[openspec] Chinese archive report generated: ${outputPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[openspec] Archive wrapper failed: ${message}`);
  process.exit(1);
});
