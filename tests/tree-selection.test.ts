import { describe, expect, it } from "vitest";
import type { KnowledgeBaseNode, SyncScope } from "@/types/sync";
import {
  attachLoadedChildren,
  collectCoveredDescendantKeys,
  collectDocumentScopes,
  normalizeSelectedSources,
  selectSourceRoots,
  sourceCoversDescendant,
  toggleSourceSelection,
  unselectSourceRoots
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

function makeFolderScope(nodeToken: string, title: string, overrides: Partial<SyncScope> = {}): SyncScope {
  return {
    kind: "folder",
    spaceId: "kb",
    spaceName: "知识库",
    title,
    displayPath: `知识库 / ${title}`,
    nodeToken,
    pathSegments: [title],
    ...overrides
  };
}

function makeBitableScope(documentId: string, title: string, overrides: Partial<SyncScope> = {}): SyncScope {
  return {
    kind: "bitable",
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
  it("collects descendant syncable leaves recursively including bitable nodes", () => {
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
      "sheet",
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

    expect(sourceCoversDescendant(parentScope, childScope)).toBe(true);
  });

  it("treats descendant bitable leaves as covered by a selected document subtree", () => {
    const parentScope = makeDocumentScope("parent", "父文档", {
      includesDescendants: true,
      pathSegments: ["父文档"]
    });
    const bitableScope = makeBitableScope("sheet", "需求池", {
      displayPath: "知识库 / 父文档 / 需求池",
      pathSegments: ["父文档", "需求池"]
    });

    expect(sourceCoversDescendant(parentScope, bitableScope)).toBe(true);
  });

  it("normalizes overlapping roots by keeping the higher subtree root", () => {
    const sources = normalizeSelectedSources([
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

  it("lets selected folders cover descendant folders and documents", () => {
    const folderScope = makeFolderScope("node-folder-parent", "父目录", {
      pathSegments: ["父目录"]
    });
    const nestedFolderScope = makeFolderScope("node-folder-child", "子目录", {
      displayPath: "知识库 / 父目录 / 子目录",
      pathSegments: ["父目录", "子目录"]
    });
    const childDocumentScope = makeDocumentScope("child", "子文档", {
      displayPath: "知识库 / 父目录 / 子文档",
      pathSegments: ["父目录", "子文档"]
    });

    expect(sourceCoversDescendant(folderScope, nestedFolderScope)).toBe(true);
    expect(sourceCoversDescendant(folderScope, childDocumentScope)).toBe(true);
  });

  it("normalizes overlapping folder and document roots by keeping the folder root", () => {
    const sources = normalizeSelectedSources([
      makeFolderScope("node-folder-parent", "父目录", {
        pathSegments: ["父目录"]
      }),
      makeDocumentScope("child", "子文档", {
        displayPath: "知识库 / 父目录 / 子文档",
        pathSegments: ["父目录", "子文档"]
      })
    ]);

    expect(sources).toHaveLength(1);
    expect(sources[0]?.kind).toBe("folder");
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
          {
            key: "bitable:kb:sheet",
            kind: "bitable",
            spaceId: "kb",
            spaceName: "知识库",
            title: "需求池",
            displayPath: "知识库 / 父文档 / 需求池",
            nodeToken: "node-sheet",
            documentId: "sheet",
            pathSegments: ["父文档", "需求池"],
            hasChildren: false,
            isExpandable: false
          },
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

    expect(disabledKeys).toEqual(["bitable:kb:node-sheet", "document:kb:child-a", "document:kb:child-b"]);
  });

  it("computes disabled descendant keys for covered folder and document nodes", () => {
    const nodes: KnowledgeBaseNode[] = [
      {
        key: "folder:kb:folder-parent",
        kind: "folder",
        spaceId: "kb",
        spaceName: "知识库",
        title: "父目录",
        displayPath: "知识库 / 父目录",
        nodeToken: "node-folder-parent",
        pathSegments: ["父目录"],
        hasChildren: true,
        isExpandable: true,
        children: [
          {
            key: "folder:kb:folder-child",
            kind: "folder",
            spaceId: "kb",
            spaceName: "知识库",
            title: "子目录",
            displayPath: "知识库 / 父目录 / 子目录",
            nodeToken: "node-folder-child",
            pathSegments: ["父目录", "子目录"],
            hasChildren: true,
            isExpandable: true,
            children: [
              makeDocument("child-a", "子文档 A", {
                pathSegments: ["父目录", "子目录", "子文档 A"],
                displayPath: "知识库 / 父目录 / 子目录 / 子文档 A"
              })
            ]
          }
        ]
      }
    ];

    const disabledKeys = collectCoveredDescendantKeys(nodes, [
      makeFolderScope("node-folder-parent", "父目录", {
        pathSegments: ["父目录"]
      })
    ]);

    expect(disabledKeys).toEqual(["document:kb:child-a", "folder:kb:node-folder-child"]);
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

    const selection = selectSourceRoots(
      existingSources,
      makeDocumentScope("parent", "父文档", { includesDescendants: true })
    );

    expect(selection.replacedCrossSpaceSelection).toBe(true);
    expect(selection.sources.map((scope) => scope.documentId)).toEqual(["parent"]);
  });

  it("removes subtree roots when unselecting them", () => {
    const sources = unselectSourceRoots(
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

    const checkedSelection = toggleSourceSelection([], parentScope, true);
    expect(checkedSelection.replacedCrossSpaceSelection).toBe(false);
    expect(checkedSelection.sources).toEqual([parentScope]);

    const uncheckedSelection = toggleSourceSelection(checkedSelection.sources, parentScope, false);
    expect(uncheckedSelection.replacedCrossSpaceSelection).toBe(false);
    expect(uncheckedSelection.sources).toEqual([]);
  });

  it("attaches fully loaded descendants back into existing tree nodes", () => {
    const rootNodes = [makeDocument("parent", "父文档", { hasChildren: true, isExpandable: true })];
    const attached = attachLoadedChildren(rootNodes, "node-parent", [makeDocument("child-a", "子文档 A")]);

    expect(attached[0]?.children?.map((node) => node.documentId)).toEqual(["child-a"]);
  });
});
