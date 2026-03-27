import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
// @ts-ignore Test imports runtime-only helper from scripts/.
import { ARCHIVE_REPORT_FILENAME, buildArchiveReport, generateArchiveReport, parseTaskStats } from "../scripts/archive-report-lib.mjs";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map(async (directory) => {
      await import("node:fs/promises").then(({ rm }) => rm(directory, { recursive: true, force: true }));
    }),
  );
});

describe("archive report generation", () => {
  it("builds a Chinese report with task and spec summaries", () => {
    const report = buildArchiveReport({
      archiveDirName: "2026-03-27-optimize-tauri-port-handling",
      schemaName: "spec-driven",
      why: "这是变更背景。",
      whatChanges: "- 调整开发端口\n- 扩展 OAuth 回调端口池",
      decisions: "### 1. 关键决策\n\n保留有限端口池。",
      taskStats: parseTaskStats("- [x] 1.1 完成实现\n- [ ] 1.2 待补充"),
      specFiles: [
        "F:/repo/openspec/changes/archive/demo/specs/localhost-port-resilience/spec.md",
      ],
      archiveDir: "F:/repo/openspec/changes/archive/demo",
    });

    expect(report).toContain("# 归档变更报告");
    expect(report).toContain("任务完成度：1/2");
    expect(report).toContain("`localhost-port-resilience`");
    expect(report).toContain("### 已完成任务");
    expect(report).toContain("### 未完成任务");
  });

  it("writes a backfilled report for an archived change directory", async () => {
    const tempDir = await mkdtemp(join(tmpdir(), "archive-report-"));
    tempDirs.push(tempDir);

    await writeFile(join(tempDir, ".openspec.yaml"), "schema: spec-driven\n", "utf8");
    await writeFile(
      join(tempDir, "proposal.md"),
      "## Why\n\n这是背景。\n\n## What Changes\n\n- 增加中文报告\n",
      "utf8",
    );
    await writeFile(join(tempDir, "design.md"), "## Decisions\n\n### 1. 决策\n\n使用脚本。\n", "utf8");
    await writeFile(join(tempDir, "tasks.md"), "- [x] 1.1 生成报告\n", "utf8");
    await mkdir(join(tempDir, "specs", "archive-change-reporting"), { recursive: true });
    await writeFile(
      join(tempDir, "specs", "archive-change-reporting", "spec.md"),
      "## ADDED Requirements\n",
      "utf8",
    );

    const outputPath = await generateArchiveReport(tempDir);
    const contents = await readFile(outputPath, "utf8");

    expect(outputPath).toBe(join(tempDir, ARCHIVE_REPORT_FILENAME));
    expect(contents).toContain("变更目录");
    expect(contents).toContain("增加中文报告");
    expect(contents).toContain("archive-change-reporting");
  });
});
