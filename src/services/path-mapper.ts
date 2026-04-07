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

/** Directory on disk for a wiki folder node (same segment sanitization as markdown output). */
export function mapFolderPath(
  syncRoot: string,
  spaceName: string,
  spaceId: string,
  pathSegments: string[]
): string {
  const safeSpaceName = sanitizePathSegment(spaceName || spaceId);
  const folderSegments = pathSegments.map(sanitizePathSegment);
  return join(syncRoot, safeSpaceName, ...folderSegments);
}

export function buildPathCollisionSuffix(documentId: string): string {
  return createHash("sha1").update(documentId).digest("hex").slice(0, 8);
}
