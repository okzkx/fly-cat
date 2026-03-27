import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AppLogger } from "@/core/logger";
import { ManifestStore } from "@/services/manifest-store";
import { SyncEngine } from "@/services/sync-engine";

const silentLogger: AppLogger = {
  log: () => undefined
};

function buildDocument(id: string, title: string) {
  return {
    id,
    spaceId: "kb",
    spaceName: "知识库",
    nodeToken: `node-${id}`,
    title,
    version: "v1",
    updateTime: "t1",
    pathSegments: [title],
    sourcePath: `知识库/${title}`
  };
}

describe("sync engine failure recovery", () => {
  it("records partial failure and preserves retryable failures", async () => {
    const syncRoot = await mkdtemp(join(tmpdir(), "sync-root-"));
    const store = new ManifestStore(join(syncRoot, ".manifest", "sync-manifest.json"));

    const mcpClient = {
      async getDocument(documentId: string): Promise<{ id: string; title: string; blocks: Array<{ type: string; text: string }> }> {
        if (documentId === "doc-fail") {
          throw new Error("mcp timeout");
        }
        return {
          id: documentId,
          title: "Synced",
          blocks: [{ type: "paragraph", text: "ok" }]
        };
      }
    };

    const imageResolver = {
      async resolve(markdown: string): Promise<string> {
        return markdown;
      }
    };

    const engine = new SyncEngine({
      syncRoot,
      mcpClient: mcpClient as never,
      manifestStore: store,
      imageResolver,
      logger: silentLogger
    });

    const docs = [buildDocument("doc-ok", "Doc OK"), buildDocument("doc-fail", "Doc Fail")];

    const result = await engine.run(docs);
    expect(result.counters.succeeded).toBe(1);
    expect(result.counters.failed).toBe(1);
    expect(result.errors[0]?.documentId).toBe("doc-fail");

    const manifest = await store.load();
    expect(manifest.records["doc-ok"].status).toBe("success");
    expect(manifest.records["doc-fail"].status).toBe("failed");
  });

  it("classifies filesystem-side write pipeline errors", async () => {
    const syncRoot = await mkdtemp(join(tmpdir(), "sync-root-"));
    const store = new ManifestStore(join(syncRoot, ".manifest", "sync-manifest.json"));
    const mcpClient = {
      async getDocument(documentId: string): Promise<{ id: string; title: string; blocks: Array<{ type: string; text: string }> }> {
        return {
          id: documentId,
          title: "Doc",
          blocks: [{ type: "paragraph", text: "content" }]
        };
      }
    };
    const imageResolver = {
      async resolve(): Promise<string> {
        throw new Error("disk denied");
      }
    };

    const engine = new SyncEngine({
      syncRoot,
      mcpClient: mcpClient as never,
      manifestStore: store,
      imageResolver,
      logger: silentLogger
    });

    const result = await engine.run([buildDocument("doc-fs", "Doc FS")]);
    expect(result.counters.failed).toBe(1);
    expect(result.errors[0]?.category).toBe("filesystem");
  });
});
