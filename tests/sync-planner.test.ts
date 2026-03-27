import { describe, expect, it } from "vitest";
import { buildSyncPlan } from "@/services/sync-planner";

describe("buildSyncPlan", () => {
  it("classifies sync, skip and retry correctly", () => {
    const docs = [
      {
        id: "1",
        spaceId: "kb",
        spaceName: "知识库",
        nodeToken: "node-1",
        title: "A",
        version: "v1",
        updateTime: "t1",
        pathSegments: ["目录", "A"],
        sourcePath: "知识库/目录/A"
      },
      {
        id: "2",
        spaceId: "kb",
        spaceName: "知识库",
        nodeToken: "node-2",
        title: "B",
        version: "v2",
        updateTime: "t2",
        pathSegments: ["目录", "B"],
        sourcePath: "知识库/目录/B"
      },
      {
        id: "3",
        spaceId: "kb",
        spaceName: "知识库",
        nodeToken: "node-3",
        title: "C",
        version: "v3",
        updateTime: "t3",
        pathSegments: ["目录", "C"],
        sourcePath: "知识库/目录/C"
      }
    ];
    const manifest = {
      records: {
        "1": {
          documentId: "1",
          version: "v1",
          updateTime: "t1",
          sourcePath: "知识库/目录/A",
          outputPath: "a.md",
          contentHash: "h1",
          status: "success" as const,
          lastSyncedAt: "x"
        },
        "2": {
          documentId: "2",
          version: "v1",
          updateTime: "t1",
          sourcePath: "知识库/目录/B",
          outputPath: "b.md",
          contentHash: "h2",
          status: "failed" as const,
          lastSyncedAt: "x"
        }
      }
    };

    const plan = buildSyncPlan(docs, manifest);
    expect(plan.toSkip.map((d) => d.id)).toEqual(["1"]);
    expect(plan.toRetry.map((d) => d.id)).toEqual(["2"]);
    expect(plan.toSync.map((d) => d.id)).toEqual(["3"]);
  });

  it("requeues documents when mirrored source path changes", () => {
    const docs = [
      {
        id: "1",
        spaceId: "kb",
        spaceName: "知识库",
        nodeToken: "node-1",
        title: "A",
        version: "v1",
        updateTime: "t1",
        pathSegments: ["新目录", "A"],
        sourcePath: "知识库/新目录/A"
      }
    ];
    const manifest = {
      records: {
        "1": {
          documentId: "1",
          version: "v1",
          updateTime: "t1",
          sourcePath: "知识库/旧目录/A",
          outputPath: "a.md",
          contentHash: "h1",
          status: "success" as const,
          lastSyncedAt: "x"
        }
      }
    };

    const plan = buildSyncPlan(docs, manifest);
    expect(plan.toSync.map((d) => d.id)).toEqual(["1"]);
    expect(plan.toSkip).toHaveLength(0);
  });
});
