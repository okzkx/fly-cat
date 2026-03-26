import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { ManifestRecord, SyncManifest } from "@/types/sync";

export class ManifestStore {
  public constructor(private readonly manifestPath: string) {}

  public async load(): Promise<SyncManifest> {
    try {
      const content = await readFile(this.manifestPath, "utf-8");
      return JSON.parse(content) as SyncManifest;
    } catch {
      return { records: {} };
    }
  }

  public async save(manifest: SyncManifest): Promise<void> {
    await mkdir(dirname(this.manifestPath), { recursive: true });
    await writeFile(this.manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
  }

  public createRecord(input: Omit<ManifestRecord, "contentHash"> & { markdown: string }): ManifestRecord {
    return {
      ...input,
      contentHash: createHash("sha256").update(input.markdown).digest("hex")
    };
  }
}
