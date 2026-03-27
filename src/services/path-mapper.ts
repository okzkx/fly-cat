import { createHash } from "node:crypto";
import { join } from "node:path";
import type { SourceDocument } from "@/types/sync";

function sanitizePathSegment(input: string): string {
  const normalized = input
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim();

  return normalized.length > 0 ? normalized : "untitled";
}

export function mapDocumentPath(syncRoot: string, document: SourceDocument): string {
  const safeSpaceName = sanitizePathSegment(document.spaceName || document.spaceId);
  const folderSegments = document.pathSegments.slice(0, -1).map(sanitizePathSegment);
  const fileName = `${sanitizePathSegment(document.title)}.md`;
  return join(syncRoot, safeSpaceName, ...folderSegments, fileName);
}

export function buildPathCollisionSuffix(documentId: string): string {
  return createHash("sha1").update(documentId).digest("hex").slice(0, 8);
}
