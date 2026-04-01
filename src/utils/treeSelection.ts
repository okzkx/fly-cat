import type { KnowledgeBaseNode, SyncScope } from "@/types/sync";
import { dedupeSelectedSources, scopeKey } from "@/utils/syncSelection";

export function buildScopeFromNode(node: KnowledgeBaseNode): SyncScope | null {
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
    if (node.kind === "document" || node.kind === "bitable") {
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
  if (ancestor.kind === "document" && descendant.kind !== "document" && descendant.kind !== "bitable") {
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

function descendantContainsKey(node: KnowledgeBaseNode, key: string): boolean {
  if (node.key === key) {
    return true;
  }
  return node.children?.some((c) => descendantContainsKey(c, key)) ?? false;
}

/**
 * Replace a covering selection by scopes for all loaded children under `parent`, minus the subtree rooted at `excludedKey`.
 */
export function scopesAfterRemovingExcluded(parent: KnowledgeBaseNode, excludedKey: string): SyncScope[] {
  const out: SyncScope[] = [];
  if (!parent.children?.length) {
    return [];
  }
  for (const child of parent.children) {
    if (child.key === excludedKey) {
      continue;
    }
    if (descendantContainsKey(child, excludedKey)) {
      out.push(...scopesAfterRemovingExcluded(child, excludedKey));
    } else {
      const cs = buildScopeFromNode(child);
      if (cs) {
        out.push(cs);
      }
    }
  }
  return out;
}

export function scopesForRootsExcludingKey(roots: KnowledgeBaseNode[], excludedKey: string): SyncScope[] {
  const out: SyncScope[] = [];
  for (const root of roots) {
    if (root.key === excludedKey) {
      continue;
    }
    if (descendantContainsKey(root, excludedKey)) {
      out.push(...scopesAfterRemovingExcluded(root, excludedKey));
    } else {
      const cs = buildScopeFromNode(root);
      if (cs) {
        out.push(cs);
      }
    }
  }
  return normalizeSelectedSources(out);
}

function findNodeMatchingScope(nodes: KnowledgeBaseNode[], target: SyncScope): KnowledgeBaseNode | null {
  for (const n of nodes) {
    const s = buildScopeFromNode(n);
    if (s && scopeKey(s) === scopeKey(target)) {
      return n;
    }
    if (n.children?.length) {
      const f = findNodeMatchingScope(n.children, target);
      if (f) {
        return f;
      }
    }
  }
  return null;
}

/**
 * When `excludedScope` is checked only because an ancestor covers it, replace that ancestor with explicit sibling scopes.
 */
export function trySubtractCoveredDescendant(
  selectedSources: SyncScope[],
  excludedScope: SyncScope,
  excludedNodeKey: string,
  spaceTrees: Record<string, KnowledgeBaseNode[]>
): { sources: SyncScope[] } | null {
  const covering = selectedSources.find(
    (s) => sourceCoversDescendant(s, excludedScope) && scopeKey(s) !== scopeKey(excludedScope)
  );
  if (!covering) {
    return null;
  }

  const roots = spaceTrees[excludedScope.spaceId];
  if (!roots?.length) {
    return null;
  }

  let newPieces: SyncScope[];
  if (covering.kind === "space") {
    newPieces = scopesForRootsExcludingKey(roots, excludedNodeKey);
  } else {
    const match = findNodeMatchingScope(roots, covering);
    if (!match?.children?.length) {
      return null;
    }
    newPieces = normalizeSelectedSources(scopesAfterRemovingExcluded(match, excludedNodeKey));
  }

  const rest = selectedSources.filter((s) => scopeKey(s) !== scopeKey(covering));
  return { sources: normalizeSelectedSources([...rest, ...newPieces]) };
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
