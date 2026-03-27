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

export function sourceHasCoveredDescendants(scope: SyncScope): boolean {
  return scope.kind === "space" || scope.kind === "folder" || (scope.kind === "document" && Boolean(scope.includesDescendants));
}

export function sourceCoversDescendant(ancestor: SyncScope, descendant: SyncScope): boolean {
  if (!sourceHasCoveredDescendants(ancestor)) {
    return false;
  }
  if (ancestor.spaceId !== descendant.spaceId || scopeKey(ancestor) === scopeKey(descendant)) {
    return false;
  }
  if (ancestor.kind === "space") {
    return descendant.kind !== "space";
  }
  if (ancestor.kind === "document" && descendant.kind !== "document") {
    return false;
  }
  if (ancestor.pathSegments.length >= descendant.pathSegments.length) {
    return false;
  }
  return ancestor.pathSegments.every((segment, index) => descendant.pathSegments[index] === segment);
}

export function normalizeSelectedSources(sources: SyncScope[]): SyncScope[] {
  const deduped = dedupeSelectedSources(sources);
  let normalized: SyncScope[] = [];

  for (const source of deduped) {
    if (normalized.some((existing) => sourceCoversDescendant(existing, source))) {
      continue;
    }

    if (sourceHasCoveredDescendants(source)) {
      normalized = normalized.filter((existing) => !sourceCoversDescendant(source, existing));
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
      selectedSources.some((source) => sourceCoversDescendant(source, currentScope))
    ) {
      disabledKeys.add(scopeKey(currentScope));
    }

    stack.push(...(current.children ?? []));
  }

  return Array.from(disabledKeys).sort();
}

export function selectSourceRoots(
  existingSources: SyncScope[],
  nextSource: SyncScope
): { replacedCrossSpaceSelection: boolean; sources: SyncScope[] } {
  const replacedCrossSpaceSelection = existingSources.some((source) => source.spaceId !== nextSource.spaceId);
  const baseSources = replacedCrossSpaceSelection
    ? []
    : existingSources.filter((source) => source.spaceId === nextSource.spaceId);

  return {
    replacedCrossSpaceSelection,
    sources: normalizeSelectedSources([...baseSources, nextSource])
  };
}

export function unselectSourceRoots(existingSources: SyncScope[], targetSource: SyncScope): SyncScope[] {
  return normalizeSelectedSources(
    existingSources.filter((source) => scopeKey(source) !== scopeKey(targetSource))
  );
}

export function toggleSourceSelection(
  existingSources: SyncScope[],
  targetSource: SyncScope,
  checked: boolean
): { replacedCrossSpaceSelection: boolean; sources: SyncScope[] } {
  if (checked) {
    return selectSourceRoots(existingSources, targetSource);
  }

  return {
    replacedCrossSpaceSelection: false,
    sources: unselectSourceRoots(existingSources, targetSource)
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
