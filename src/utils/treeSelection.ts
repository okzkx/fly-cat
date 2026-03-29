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

/**
 * Collect all descendant keys from KnowledgeBaseNode tree data for a given node key.
 */
export function collectAllDescendantKeys(nodes: KnowledgeBaseNode[], targetKey: string): string[] {
  const result: string[] = [];
  let found = false;

  function walk(currentNodes: KnowledgeBaseNode[]): void {
    for (const node of currentNodes) {
      if (!found) {
        if (node.key === targetKey) {
          found = true;
          // Add all children of the target
          addChildrenKeys(node.children);
          return;
        }
        if (node.children?.length) {
          walk(node.children);
        }
      }
    }
  }

  function addChildrenKeys(children: KnowledgeBaseNode[] | undefined): void {
    if (!children) return;
    for (const child of children) {
      result.push(child.key);
      addChildrenKeys(child.children);
    }
  }

  walk(nodes);
  return result;
}

/**
 * Tri-state type for a node's aggregate check state.
 */
export type TriState = "all-checked" | "none-checked" | "mixed";

/**
 * Compute the tri-state of a node based on current checked keys and its descendant keys.
 * Returns "all-checked" if self + all descendants are checked.
 * Returns "none-checked" if self + all descendants are unchecked.
 * Returns "mixed" if some but not all are checked.
 */
export function computeTriState(
  currentCheckedKeys: Set<string>,
  nodeKey: string,
  allDescendantKeys: string[]
): TriState {
  // Include self in the evaluation
  const allKeys = [nodeKey, ...allDescendantKeys];
  const checkedCount = allKeys.filter((key) => currentCheckedKeys.has(key)).length;

  if (checkedCount === allKeys.length) {
    return "all-checked";
  }
  if (checkedCount === 0) {
    return "none-checked";
  }
  return "mixed";
}

/**
 * Compute the new set of checked keys after a tri-state toggle.
 *
 * From none-checked -> check self and all descendants
 * From all-checked -> uncheck self and all descendants
 * From mixed -> check self and all descendants
 */
export function computeCascadedCheckedKeys(
  currentCheckedKeys: Set<string>,
  nodeKey: string,
  allDescendantKeys: string[],
  currentState: TriState
): Set<string> {
  const next = new Set(currentCheckedKeys);
  const allKeys = [nodeKey, ...allDescendantKeys];

  if (currentState === "all-checked") {
    // Transition to none-checked: remove all
    for (const key of allKeys) {
      next.delete(key);
    }
  } else {
    // Transition to all-checked: from none-checked or mixed, check all
    for (const key of allKeys) {
      next.add(key);
    }
  }

  return next;
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
