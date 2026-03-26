import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { SyncError } from "@/core/errors";
import type { AppLogger } from "@/core/logger";
import { toCanonicalDocument, renderMarkdown } from "@/services/markdown-renderer";
import type { McpFeishuClient } from "@/services/mcp-client";
import type { ManifestStore } from "@/services/manifest-store";
import { mapDocumentPath } from "@/services/path-mapper";
import type { SourceDocument, SyncCounters, SyncManifest, SyncRunError } from "@/types/sync";

interface ImageResolverLike {
  resolve(markdown: string, markdownPath: string): Promise<string>;
}

export interface SyncEngineDeps {
  syncRoot: string;
  mcpClient: McpFeishuClient;
  manifestStore: ManifestStore;
  imageResolver: ImageResolverLike;
  logger: AppLogger;
}

export class SyncEngine {
  public constructor(private readonly deps: SyncEngineDeps) {}

  public async run(documents: SourceDocument[]): Promise<{ counters: SyncCounters; errors: SyncRunError[] }> {
    const manifest = await this.deps.manifestStore.load();
    const counters: SyncCounters = {
      total: documents.length,
      processed: 0,
      succeeded: 0,
      skipped: 0,
      failed: 0
    };
    const errors: SyncRunError[] = [];

    for (const document of documents) {
      const existing = manifest.records[document.id];
      if (existing && existing.version === document.version && existing.updateTime === document.updateTime) {
        counters.processed += 1;
        counters.skipped += 1;
        continue;
      }

      try {
        const payload = await this.deps.mcpClient.getDocument(document.id);
        const canonical = toCanonicalDocument(payload);
        let markdown = renderMarkdown(canonical);
        const outputPath = mapDocumentPath(this.deps.syncRoot, document);
        markdown = await this.deps.imageResolver.resolve(markdown, outputPath);
        await mkdir(dirname(outputPath), { recursive: true });
        await writeFile(outputPath, markdown, "utf-8");

        manifest.records[document.id] = this.deps.manifestStore.createRecord({
          documentId: document.id,
          version: document.version,
          updateTime: document.updateTime,
          outputPath,
          markdown,
          status: "success",
          lastSyncedAt: new Date().toISOString()
        });
        counters.succeeded += 1;
      } catch (error) {
        const syncError = error instanceof SyncError ? error : new SyncError("filesystem", String(error));
        manifest.records[document.id] = {
          documentId: document.id,
          version: document.version,
          updateTime: document.updateTime,
          outputPath: "",
          contentHash: "",
          status: "failed",
          lastSyncedAt: new Date().toISOString(),
          lastError: syncError.message
        };
        counters.failed += 1;
        errors.push({
          documentId: document.id,
          title: document.title,
          category: syncError.category === "validation" ? "transform" : syncError.category,
          message: syncError.message
        });
        this.deps.logger.log("error", "sync-engine", "document sync failed", { documentId: document.id, error: syncError.message });
      } finally {
        counters.processed += 1;
      }
    }

    await this.deps.manifestStore.save(manifest as SyncManifest);
    return { counters, errors };
  }
}
