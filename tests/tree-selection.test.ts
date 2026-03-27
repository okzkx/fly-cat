import { describe, expect, it } from "vitest";
import type { KnowledgeBaseNode, SyncScope } from "@/types/sync";
import { attachLoadedChildren, collectDocumentScopes, mergeDocumentSubtreeSelection } from "@/utils/treeSelection";

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

describe("tree selection helpers", () => {
  it("collects descendant documents recursively while ignoring bitable nodes", () => {
    const nodes: KnowledgeBaseNode[] = [
      makeDocument("parent", "父文档", {
        hasChildren: true,
        isExpandable: true,
        children: [
          makeDocument("child-a", "子文档 A"),
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
            children: [makeDocument("grandchild", "孙文档")]
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

  it("merges one-click subtree selection into same-space selection set", () => {
    const existingSources: SyncScope[] = [
      {
        kind: "document",
        spaceId: "kb",
        spaceName: "知识库",
        title: "已选文档",
        displayPath: "知识库 / 已选文档",
        nodeToken: "node-existing",
        documentId: "existing",
        pathSegments: ["已选文档"]
      }
    ];
    const parentScope: SyncScope = {
      kind: "document",
      spaceId: "kb",
      spaceName: "知识库",
      title: "父文档",
      displayPath: "知识库 / 父文档",
      nodeToken: "node-parent",
      documentId: "parent",
      pathSegments: ["父文档"]
    };
    const descendants = [
      makeDocument("child-a", "子文档 A"),
      makeDocument("child-b", "子文档 B")
    ];

    const merged = mergeDocumentSubtreeSelection(existingSources, parentScope, descendants);

    expect(merged.map((scope) => scope.documentId)).toEqual(["existing", "parent", "child-a", "child-b"]);
  });

  it("replaces cross-space selection when subtree comes from another knowledge base", () => {
    const existingSources: SyncScope[] = [
      {
        kind: "document",
        spaceId: "kb-other",
        spaceName: "其他知识库",
        title: "旧文档",
        displayPath: "其他知识库 / 旧文档",
        nodeToken: "node-old",
        documentId: "old",
        pathSegments: ["旧文档"]
      }
    ];
    const parentScope: SyncScope = {
      kind: "document",
      spaceId: "kb",
      spaceName: "知识库",
      title: "父文档",
      displayPath: "知识库 / 父文档",
      nodeToken: "node-parent",
      documentId: "parent",
      pathSegments: ["父文档"]
    };

    const merged = mergeDocumentSubtreeSelection(existingSources, parentScope, [makeDocument("child-a", "子文档 A")]);

    expect(merged.map((scope) => scope.documentId)).toEqual(["parent", "child-a"]);
  });

  it("attaches fully loaded descendants back into existing tree nodes", () => {
    const rootNodes = [makeDocument("parent", "父文档", { hasChildren: true, isExpandable: true })];
    const attached = attachLoadedChildren(rootNodes, "node-parent", [makeDocument("child-a", "子文档 A")]);

    expect(attached[0]?.children?.map((node) => node.documentId)).toEqual(["child-a"]);
  });
});
