import type { SourceDocument } from "@/types/sync";

function sanitizePathSegment(input: string): string {
  const normalized = input
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_")
    .replace(/[. ]+$/g, "")
    .trim();

  return normalized.length > 0 ? normalized : "untitled";
}

function inferPathSeparator(root: string): "/" | "\\" {
  if (root.includes("\\") || /^[A-Za-z]:([\\/]|$)/.test(root) || root.startsWith("\\\\")) {
    return "\\";
  }
  return "/";
}

function joinLocalPath(root: string, ...segments: string[]): string {
  const separator = inferPathSeparator(root);
  const cleanedRoot = root === separator ? separator : root.replace(/[\\/]+$/g, "");
  const cleanedSegments = segments
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.replace(/^[\\/]+|[\\/]+$/g, ""));

  if (cleanedSegments.length === 0) {
    return cleanedRoot || separator;
  }
  if (!cleanedRoot) {
    return cleanedSegments.join(separator);
  }
  return `${cleanedRoot}${separator}${cleanedSegments.join(separator)}`;
}

function hashStringFnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function mapDocumentPath(syncRoot: string, document: SourceDocument): string {
  const safeSpaceName = sanitizePathSegment(document.spaceName || document.spaceId);
  const folderSegments = document.pathSegments.slice(0, -1).map(sanitizePathSegment);
  const fileName = `${sanitizePathSegment(document.title)}.md`;
  return joinLocalPath(syncRoot, safeSpaceName, ...folderSegments, fileName);
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
  return joinLocalPath(syncRoot, safeSpaceName, ...folderSegments);
}

export function buildPathCollisionSuffix(documentId: string): string {
  return hashStringFnv1a(documentId);
}
