import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";

export const ARCHIVE_REPORT_FILENAME = "change-report.zh-CN.md";

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readTextIfExists(path) {
  if (!(await exists(path))) {
    return "";
  }

  return readFile(path, "utf8");
}

async function listSpecFiles(directory) {
  if (!(await exists(directory))) {
    return [];
  }

  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSpecFiles(fullPath)));
    } else if (entry.isFile() && entry.name === "spec.md") {
      files.push(fullPath);
    }
  }

  return files.sort();
}

export function extractMarkdownSection(markdown, heading) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const headingLine = `## ${heading}`;
  const startIndex = lines.findIndex((line) => line.trim() === headingLine);

  if (startIndex === -1) {
    return "";
  }

  const content = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith("## ")) {
      break;
    }
    content.push(lines[index]);
  }

  return content.join("\n").trim();
}

export function parseTaskStats(tasksMarkdown) {
  const normalized = tasksMarkdown.replace(/\r\n/g, "\n");
  const matches = [...normalized.matchAll(/^- \[( |x)\] (.+)$/gm)];
  const items = matches.map((match) => ({
    done: match[1] === "x",
    text: match[2].trim(),
  }));

  return {
    total: items.length,
    complete: items.filter((item) => item.done).length,
    remaining: items.filter((item) => !item.done).length,
    items,
  };
}

function normalizeListSection(section) {
  if (!section) {
    return "- 无";
  }

  return section
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join("\n");
}

function summarizeSpecCapabilities(specFiles, archiveDir) {
  if (specFiles.length === 0) {
    return ["- 无"];
  }

  return specFiles.map((filePath) => {
    const capability = basename(resolve(filePath, ".."));
    const relativePath = relative(archiveDir, filePath).replaceAll("\\", "/");
    return `- \`${capability}\`：归档中包含 delta spec（\`${relativePath}\`）`;
  });
}

export function buildArchiveReport({
  archiveDirName,
  schemaName,
  why,
  whatChanges,
  decisions,
  taskStats,
  specFiles,
  archiveDir,
}) {
  const completedTasks = taskStats.items
    .filter((item) => item.done)
    .map((item) => `- ${item.text}`);
  const pendingTasks = taskStats.items
    .filter((item) => !item.done)
    .map((item) => `- ${item.text}`);

  return [
    "# 归档变更报告",
    "",
    "## 基本信息",
    "",
    `- 变更目录：\`${archiveDirName}\``,
    `- 工作流 Schema：\`${schemaName}\``,
    `- 归档报告文件：\`${ARCHIVE_REPORT_FILENAME}\``,
    `- 任务完成度：${taskStats.complete}/${taskStats.total}`,
    `- 规格变更数量：${specFiles.length}`,
    "",
    "## 变更背景",
    "",
    why || "未找到 proposal 中的 Why 段落。",
    "",
    "## 变更内容",
    "",
    normalizeListSection(whatChanges),
    "",
    "## 关键设计",
    "",
    decisions || "未找到 design 中的 Decisions 段落。",
    "",
    "## 规格影响",
    "",
    ...summarizeSpecCapabilities(specFiles, archiveDir),
    "",
    "## 任务完成情况",
    "",
    `- 已完成：${taskStats.complete}`,
    `- 未完成：${taskStats.remaining}`,
    "",
    "### 已完成任务",
    "",
    ...(completedTasks.length > 0 ? completedTasks : ["- 无"]),
    "",
    "### 未完成任务",
    "",
    ...(pendingTasks.length > 0 ? pendingTasks : ["- 无"]),
    "",
  ].join("\n");
}

export async function generateArchiveReport(archiveDir) {
  const resolvedArchiveDir = resolve(archiveDir);
  const proposal = await readTextIfExists(join(resolvedArchiveDir, "proposal.md"));
  const design = await readTextIfExists(join(resolvedArchiveDir, "design.md"));
  const tasks = await readTextIfExists(join(resolvedArchiveDir, "tasks.md"));
  const schemaText = await readTextIfExists(join(resolvedArchiveDir, ".openspec.yaml"));
  const specFiles = await listSpecFiles(join(resolvedArchiveDir, "specs"));
  const schemaName = schemaText.match(/^schema:\s*(.+)$/m)?.[1]?.trim() ?? "unknown";
  const report = buildArchiveReport({
    archiveDirName: basename(resolvedArchiveDir),
    schemaName,
    why: extractMarkdownSection(proposal, "Why"),
    whatChanges: extractMarkdownSection(proposal, "What Changes"),
    decisions: extractMarkdownSection(design, "Decisions"),
    taskStats: parseTaskStats(tasks),
    specFiles,
    archiveDir: resolvedArchiveDir,
  });
  const outputPath = join(resolvedArchiveDir, ARCHIVE_REPORT_FILENAME);

  await writeFile(outputPath, report, "utf8");
  return outputPath;
}

export async function resolveArchiveDir({ archiveRoot, changeName, archiveDir }) {
  if (archiveDir) {
    return resolve(archiveDir);
  }

  if (!changeName) {
    throw new Error("Missing change name or archive directory.");
  }

  const entries = await readdir(archiveRoot, { withFileTypes: true });
  const candidates = entries
    .filter((entry) => entry.isDirectory() && entry.name.endsWith(`-${changeName}`))
    .map((entry) => join(archiveRoot, entry.name));

  if (candidates.length === 0) {
    throw new Error(`Could not find archived change directory for '${changeName}'.`);
  }

  const candidateStats = await Promise.all(
    candidates.map(async (candidate) => ({ candidate, stats: await stat(candidate) })),
  );

  candidateStats.sort((left, right) => right.stats.mtimeMs - left.stats.mtimeMs);
  return candidateStats[0].candidate;
}
