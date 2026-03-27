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
  const seen = new Set<string>();
  const deduped: SyncScope[] = [];
  for (const source of sources) {
    const key = scopeKey(source);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    deduped.push(source);
  }
  return deduped;
}

export function getEffectiveSelectedSources(selectedScope: SyncScope | null, selectedDocumentSources: SyncScope[]): SyncScope[] {
  if (selectedDocumentSources.length > 0) {
    return dedupeSelectedSources(selectedDocumentSources);
  }
  return selectedScope ? [selectedScope] : [];
}

export function getLegacySelectedScope(selectedSources: SyncScope[]): SyncScope | null {
  return selectedSources.length === 1 ? selectedSources[0] : null;
}

export function buildSelectionSummary(selectedSources: SyncScope[], selectedScope?: SyncScope | null): SyncSelectionSummary | null {
  const sources = dedupeSelectedSources(selectedSources);
  if (sources.length === 0) {
    return selectedScope
      ? {
          kind: selectedScope.kind,
          spaceId: selectedScope.spaceId,
          spaceName: selectedScope.spaceName,
          title: selectedScope.title,
          displayPath: selectedScope.displayPath,
          documentCount: selectedScope.kind === "document" ? 1 : 0,
          previewPaths: [selectedScope.displayPath]
        }
      : null;
  }

  if (sources.length === 1) {
    const source = sources[0];
    return {
      kind: source.kind,
      spaceId: source.spaceId,
      spaceName: source.spaceName,
      title: source.title,
      displayPath: source.displayPath,
      documentCount: source.kind === "document" ? 1 : 0,
      previewPaths: [source.displayPath]
    };
  }

  const [first] = sources;
  return {
    kind: "multi-document",
    spaceId: first.spaceId,
    spaceName: first.spaceName,
    title: `${first.spaceName} 多文档同步`,
    displayPath: `${first.spaceName}（已选 ${sources.length} 篇文档）`,
    documentCount: sources.length,
    previewPaths: sources.slice(0, 3).map((source) => source.displayPath)
  };
}
