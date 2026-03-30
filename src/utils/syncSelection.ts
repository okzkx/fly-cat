import type { SyncScope, SyncSelectionSummary } from "@/types/sync";

export function scopeKey(scope: SyncScope): string {
  if (scope.kind === "space") {
    return `space:${scope.spaceId}`;
  }
  if (scope.kind === "document" && scope.documentId) {
    return `document:${scope.spaceId}:${scope.documentId}`;
  }
  return `${scope.kind}:${scope.spaceId}:${scope.nodeToken ?? scope.title}`;
}

export function dedupeSelectedSources(sources: SyncScope[]): SyncScope[] {
  const deduped = new Map<string, SyncScope>();
  for (const source of sources) {
    const key = scopeKey(source);
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, source);
      continue;
    }
    if (source.includesDescendants && !existing.includesDescendants) {
      deduped.set(key, source);
    }
  }
  return Array.from(deduped.values());
}

export function getEffectiveSelectedSources(selectedScope: SyncScope | null, selectedSources: SyncScope[]): SyncScope[] {
  if (selectedSources.length > 0) {
    return dedupeSelectedSources(selectedSources);
  }
  return selectedScope ? [selectedScope] : [];
}

export function getLegacySelectedScope(selectedSources: SyncScope[]): SyncScope | null {
  return selectedSources.length === 1 ? selectedSources[0] : null;
}

export function buildSelectionSummary(
  selectedSources: SyncScope[],
  selectedScope?: SyncScope | null,
  options?: { effectiveDocumentCount?: number }
): SyncSelectionSummary | null {
  const sources = dedupeSelectedSources(selectedSources);
  if (sources.length === 0) {
    return selectedScope
      ? {
          kind: selectedScope.kind,
          spaceId: selectedScope.spaceId,
          spaceName: selectedScope.spaceName,
          title: selectedScope.title,
          displayPath: selectedScope.displayPath,
          documentCount: selectedScope.kind === "document" || selectedScope.kind === "bitable" ? 1 : 0,
          previewPaths: [selectedScope.displayPath],
          includesDescendants: Boolean(selectedScope.includesDescendants),
          rootCount: 1
        }
      : null;
  }

  if (sources.length === 1) {
    const source = sources[0];
    const effectiveDocumentCount =
      options?.effectiveDocumentCount ?? (source.kind === "document" || source.kind === "bitable" ? 1 : 0);
    return {
      kind: source.kind,
      spaceId: source.spaceId,
      spaceName: source.spaceName,
      title: source.title,
      displayPath: source.displayPath,
      documentCount: effectiveDocumentCount,
      previewPaths: [source.displayPath],
      includesDescendants: Boolean(source.includesDescendants),
      rootCount: 1
    };
  }

  const [first] = sources;
  const allDocuments = sources.every((source) => source.kind === "document");
  const includesDescendants = sources.some((source) => source.includesDescendants);
  const rootCount = sources.length;
  return {
    kind: allDocuments ? "multi-document" : "multi-source",
    spaceId: first.spaceId,
    spaceName: first.spaceName,
    title: allDocuments
      ? includesDescendants
        ? `${first.spaceName} 文档分支同步`
        : `${first.spaceName} 多文档同步`
      : `${first.spaceName} 多来源同步`,
    displayPath: includesDescendants
      ? allDocuments
        ? `${first.spaceName}（已选 ${rootCount} 个文档分支）`
        : `${first.spaceName}（已选 ${rootCount} 个同步根）`
      : allDocuments
        ? `${first.spaceName}（已选 ${rootCount} 篇文档）`
        : `${first.spaceName}（已选 ${rootCount} 个同步根）`,
    documentCount: options?.effectiveDocumentCount ?? rootCount,
    previewPaths: sources.slice(0, 3).map((source) => source.displayPath),
    includesDescendants,
    rootCount
  };
}
