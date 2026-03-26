import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { ManifestStore } from "@/services/manifest-store";

describe("manifest store", () => {
  it("saves and loads records", async () => {
    const dir = await mkdtemp(join(tmpdir(), "manifest-"));
    const store = new ManifestStore(join(dir, "sync-manifest.json"));
    const manifest = {
      records: {
        "doc-1": {
          documentId: "doc-1",
          version: "v1",
          updateTime: "t1",
          outputPath: "/tmp/a.md",
          contentHash: "x",
          status: "success" as const,
          lastSyncedAt: new Date().toISOString()
        }
      }
    };
    await store.save(manifest);
    const loaded = await store.load();
    expect(loaded.records["doc-1"].version).toBe("v1");
  });
});
