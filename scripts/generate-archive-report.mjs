import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { generateArchiveReport, resolveArchiveDir } from "./archive-report-lib.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");
const archiveRoot = resolve(projectRoot, "openspec", "changes", "archive");

function parseArgs(argv) {
  const parsed = {
    archiveDir: "",
    changeName: "",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === "--archive-dir") {
      parsed.archiveDir = argv[index + 1] ?? "";
      index += 1;
    } else if (current === "--change") {
      parsed.changeName = argv[index + 1] ?? "";
      index += 1;
    }
  }

  return parsed;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const archiveDir = await resolveArchiveDir({
    archiveRoot,
    archiveDir: args.archiveDir,
    changeName: args.changeName,
  });
  const outputPath = await generateArchiveReport(archiveDir);

  console.log(`[openspec] Chinese archive report generated: ${outputPath}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[openspec] Failed to generate archive report: ${message}`);
  process.exit(1);
});
