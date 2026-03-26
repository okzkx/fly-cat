import { createHash } from "node:crypto";
import { join } from "node:path";
import type { SourceDocument } from "@/types/sync";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function mapDocumentPath(syncRoot: string, document: SourceDocument): string {
  const titleSlug = slugify(document.title) || "untitled";
  const shortHash = createHash("sha1").update(document.id).digest("hex").slice(0, 8);
  return join(syncRoot, document.spaceId, `${titleSlug}-${shortHash}.md`);
}
