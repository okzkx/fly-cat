import type { KnowledgeBaseNode, SyncScope } from "@/types/sync";
import { dedupeSelectedSources, scopeKey } from "@/utils/syncSelection";

export function buildScopeFromNode(node: KnowledgeBaseNode): SyncScope | null {
  if (node.kind === "bitable") {
    return null;
  }

  return {
    kind: node.kind,
    spaceId: node.spaceId,
    spaceName: node.spaceName,
    title: node.title,
    displayPath: node.displayPath,
    nodeToken: node.nodeToken,
    documentId: node.documentId,
    pathSegments: node.pathSegments,
    includesDescendants: node.kind === "document" && node.hasChildren
  };
}

export function collectDocumentScopes(nodes: KnowledgeBaseNode[]): SyncScope[] {
  const scopes: SyncScope[] = [];
  for (const node of nodes) {
    if (node.kind === "document") {
      const scope = buildScopeFromNode(node);
      if (scope) {
        scopes.push(scope);
      }
    }

    if (node.children?.length) {
      scopes.push(...collectDocumentScopes(node.children));
    }
  }

  return scopes;
}

export function isDocumentSubtreeSelection(scope: SyncScope): boolean {
  return scope.kind === "document" && Boolean(scope.includesDescendants);
}

export function documentSourceCoversDescendant(ancestor: SyncScope, descendant: SyncScope): boolean {
  if (!isDocumentSubtreeSelection(ancestor) || descendant.kind !== "document") {
    return false;
  }
  if (ancestor.spaceId !== descendant.spaceId || ancestor.documentId === descendant.documentId) {
    return false;
  }
  if (ancestor.pathSegments.length >= descendant.pathSegments.length) {
    return false;
  }
  return ancestor.pathSegments.every((segment, index) => descendant.pathSegments[index] === segment);
}

export function normalizeDocumentRootSources(sources: SyncScope[]): SyncScope[] {
  const deduped = dedupeSelectedSources(sources.filter((source) => source.kind === "document"));
  let normalized: SyncScope[] = [];

  for (const source of deduped) {
    if (normalized.some((existing) => documentSourceCoversDescendant(existing, source))) {
      continue;
    }

    if (source.includesDescendants) {
      normalized = normalized.filter((existing) => !documentSourceCoversDescendant(source, existing));
    }

    normalized.push(source);
  }

  return normalized;
}

export function collectCoveredDescendantKeys(nodes: KnowledgeBaseNode[], selectedSources: SyncScope[]): string[] {
  const disabledKeys = new Set<string>();
  const stack = [...nodes];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    const currentScope = buildScopeFromNode(current);
    if (
      currentScope &&
      selectedSources.some((source) => documentSourceCoversDescendant(source, currentScope))
    ) {
      disabledKeys.add(scopeKey(currentScope));
    }

    stack.push(...(current.children ?? []));
  }

  return Array.from(disabledKeys).sort();
}

export function selectDocumentRootSources(
  existingSources: SyncScope[],
  nextSource: SyncScope
): { replacedCrossSpaceSelection: boolean; sources: SyncScope[] } {
  const replacedCrossSpaceSelection = existingSources.some((source) => source.spaceId !== nextSource.spaceId);
  const baseSources = replacedCrossSpaceSelection
    ? []
    : existingSources.filter((source) => source.spaceId === nextSource.spaceId);

  return {
    replacedCrossSpaceSelection,
    sources: normalizeDocumentRootSources([...baseSources, nextSource])
  };
}

export function unselectDocumentRootSources(existingSources: SyncScope[], targetSource: SyncScope): SyncScope[] {
  return normalizeDocumentRootSources(
    existingSources.filter((source) => scopeKey(source) !== scopeKey(targetSource))
  );
}

export function toggleDocumentRootSourceSelection(
  existingSources: SyncScope[],
  targetSource: SyncScope,
  checked: boolean
): { replacedCrossSpaceSelection: boolean; sources: SyncScope[] } {
  if (checked) {
    return selectDocumentRootSources(existingSources, targetSource);
  }

  return {
    replacedCrossSpaceSelection: false,
    sources: unselectDocumentRootSources(existingSources, targetSource)
  };
}

export function attachLoadedChildren(
  nodes: KnowledgeBaseNode[],
  parentNodeToken: string,
  children: KnowledgeBaseNode[]
): KnowledgeBaseNode[] {
  return nodes.map((node) => {
    if (node.nodeToken === parentNodeToken) {
      return {
        ...node,
        children
      };
    }

    if (!node.children?.length) {
      return node;
    }

    return {
      ...node,
      children: attachLoadedChildren(node.children, parentNodeToken, children)
    };
  });
}
