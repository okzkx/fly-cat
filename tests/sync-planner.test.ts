import { describe, expect, it } from "vitest";
import { buildSyncPlan } from "@/services/sync-planner";

describe("buildSyncPlan", () => {
  it("classifies sync, skip and retry correctly", () => {
    const docs = [
      { id: "1", spaceId: "kb", title: "A", version: "v1", updateTime: "t1" },
      { id: "2", spaceId: "kb", title: "B", version: "v2", updateTime: "t2" },
      { id: "3", spaceId: "kb", title: "C", version: "v3", updateTime: "t3" }
    ];
    const manifest = {
      records: {
        "1": { documentId: "1", version: "v1", updateTime: "t1", outputPath: "a.md", contentHash: "h1", status: "success" as const, lastSyncedAt: "x" },
        "2": { documentId: "2", version: "v1", updateTime: "t1", outputPath: "b.md", contentHash: "h2", status: "failed" as const, lastSyncedAt: "x" }
      }
    };

    const plan = buildSyncPlan(docs, manifest);
    expect(plan.toSkip.map((d) => d.id)).toEqual(["1"]);
    expect(plan.toRetry.map((d) => d.id)).toEqual(["2"]);
    expect(plan.toSync.map((d) => d.id)).toEqual(["3"]);
  });
});
