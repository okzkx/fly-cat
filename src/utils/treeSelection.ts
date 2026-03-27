import type { KnowledgeBaseNode, SyncScope } from "@/types/sync";
import { dedupeSelectedSources } from "@/utils/syncSelection";

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
    pathSegments: node.pathSegments
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

export function mergeDocumentSubtreeSelection(
  existingSources: SyncScope[],
  parentScope: SyncScope,
  descendantNodes: KnowledgeBaseNode[]
): SyncScope[] {
  const subtreeSources = dedupeSelectedSources([parentScope, ...collectDocumentScopes(descendantNodes)]);
  const sameSpaceOnly = existingSources.every((source) => source.spaceId === parentScope.spaceId);

  return dedupeSelectedSources([...(sameSpaceOnly ? existingSources : []), ...subtreeSources]);
}
