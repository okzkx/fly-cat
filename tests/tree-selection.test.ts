import { describe, expect, it } from "vitest";
import type { KnowledgeBaseNode, SyncScope } from "@/types/sync";
import {
  attachLoadedChildren,
  collectCoveredDescendantKeys,
  collectDocumentScopes,
  documentSourceCoversDescendant,
  normalizeDocumentRootSources,
  selectDocumentRootSources,
  toggleDocumentRootSourceSelection,
  unselectDocumentRootSources
} from "@/utils/treeSelection";

function makeDocument(
  documentId: string,
  title: string,
  overrides: Partial<KnowledgeBaseNode> = {}
): KnowledgeBaseNode {
  return {
    key: `document:kb:${documentId}`,
    kind: "document",
    spaceId: "kb",
    spaceName: "知识库",
    title,
    displayPath: `知识库 / ${title}`,
    nodeToken: `node-${documentId}`,
    documentId,
    pathSegments: [title],
    hasChildren: false,
    isExpandable: false,
    ...overrides
  };
}

function makeDocumentScope(documentId: string, title: string, overrides: Partial<SyncScope> = {}): SyncScope {
  return {
    kind: "document",
    spaceId: "kb",
    spaceName: "知识库",
    title,
    displayPath: `知识库 / ${title}`,
    nodeToken: `node-${documentId}`,
    documentId,
    pathSegments: [title],
    ...overrides
  };
}

describe("tree selection helpers", () => {
  it("collects descendant documents recursively while ignoring bitable nodes", () => {
    const nodes: KnowledgeBaseNode[] = [
      makeDocument("parent", "父文档", {
        hasChildren: true,
        isExpandable: true,
        children: [
          makeDocument("child-a", "子文档 A", {
            pathSegments: ["父文档", "子文档 A"],
            displayPath: "知识库 / 父文档 / 子文档 A"
          }),
          {
            key: "bitable:kb:sheet",
            kind: "bitable",
            spaceId: "kb",
            spaceName: "知识库",
            title: "需求池",
            displayPath: "知识库 / 需求池",
            nodeToken: "node-sheet",
            documentId: "sheet",
            pathSegments: ["需求池"],
            hasChildren: false,
            isExpandable: false
          },
          makeDocument("child-b", "子文档 B", {
            hasChildren: true,
            isExpandable: true,
            pathSegments: ["父文档", "子文档 B"],
            displayPath: "知识库 / 父文档 / 子文档 B",
            children: [
              makeDocument("grandchild", "孙文档", {
                pathSegments: ["父文档", "子文档 B", "孙文档"],
                displayPath: "知识库 / 父文档 / 子文档 B / 孙文档"
              })
            ]
          })
        ]
      })
    ];

    expect(collectDocumentScopes(nodes).map((scope) => scope.documentId)).toEqual([
      "parent",
      "child-a",
      "child-b",
      "grandchild"
    ]);
  });

  it("detects descendant coverage from a selected subtree root", () => {
    const parentScope = makeDocumentScope("parent", "父文档", {
      includesDescendants: true,
      pathSegments: ["父文档"]
    });
    const childScope = makeDocumentScope("child", "子文档", {
      pathSegments: ["父文档", "子文档"]
    });

    expect(documentSourceCoversDescendant(parentScope, childScope)).toBe(true);
  });

  it("normalizes overlapping roots by keeping the higher subtree root", () => {
    const sources = normalizeDocumentRootSources([
      makeDocumentScope("child", "子文档", {
        pathSegments: ["父文档", "子文档"]
      }),
      makeDocumentScope("parent", "父文档", {
        includesDescendants: true,
        pathSegments: ["父文档"]
      })
    ]);

    expect(sources.map((scope) => scope.documentId)).toEqual(["parent"]);
  });

  it("computes disabled descendant keys for covered document nodes", () => {
    const nodes: KnowledgeBaseNode[] = [
      makeDocument("parent", "父文档", {
        hasChildren: true,
        isExpandable: true,
        children: [
          makeDocument("child-a", "子文档 A", {
            pathSegments: ["父文档", "子文档 A"],
            displayPath: "知识库 / 父文档 / 子文档 A"
          }),
          makeDocument("child-b", "子文档 B", {
            pathSegments: ["父文档", "子文档 B"],
            displayPath: "知识库 / 父文档 / 子文档 B"
          })
        ]
      })
    ];

    const disabledKeys = collectCoveredDescendantKeys(nodes, [
      makeDocumentScope("parent", "父文档", {
        includesDescendants: true,
        pathSegments: ["父文档"]
      })
    ]);

    expect(disabledKeys).toEqual(["document:kb:child-a", "document:kb:child-b"]);
  });

  it("replaces cross-space selection when picking a root from another knowledge base", () => {
    const existingSources: SyncScope[] = [
      {
        ...makeDocumentScope("old", "旧文档"),
        spaceId: "kb-other",
        spaceName: "其他知识库",
        displayPath: "其他知识库 / 旧文档"
      }
    ];

    const selection = selectDocumentRootSources(
      existingSources,
      makeDocumentScope("parent", "父文档", { includesDescendants: true })
    );

    expect(selection.replacedCrossSpaceSelection).toBe(true);
    expect(selection.sources.map((scope) => scope.documentId)).toEqual(["parent"]);
  });

  it("removes subtree roots when unselecting them", () => {
    const sources = unselectDocumentRootSources(
      [makeDocumentScope("parent", "父文档", { includesDescendants: true })],
      makeDocumentScope("parent", "父文档", { includesDescendants: true })
    );

    expect(sources).toEqual([]);
  });

  it("toggles subtree roots using only local selection state", () => {
    const parentScope = makeDocumentScope("parent", "父文档", {
      includesDescendants: true,
      pathSegments: ["父文档"]
    });

    const checkedSelection = toggleDocumentRootSourceSelection([], parentScope, true);
    expect(checkedSelection.replacedCrossSpaceSelection).toBe(false);
    expect(checkedSelection.sources).toEqual([parentScope]);

    const uncheckedSelection = toggleDocumentRootSourceSelection(checkedSelection.sources, parentScope, false);
    expect(uncheckedSelection.replacedCrossSpaceSelection).toBe(false);
    expect(uncheckedSelection.sources).toEqual([]);
  });

  it("attaches fully loaded descendants back into existing tree nodes", () => {
    const rootNodes = [makeDocument("parent", "父文档", { hasChildren: true, isExpandable: true })];
    const attached = attachLoadedChildren(rootNodes, "node-parent", [makeDocument("child-a", "子文档 A")]);

    expect(attached[0]?.children?.map((node) => node.documentId)).toEqual(["child-a"]);
  });
});
