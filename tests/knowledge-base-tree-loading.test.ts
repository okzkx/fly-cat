import { beforeEach, describe, expect, it } from "vitest";
import { createSyncTask, listKnowledgeBaseNodes } from "../src/utils/browserTaskManager";
import { buildScopeFromNode, toggleSourceSelection } from "../src/utils/treeSelection";

if (!("localStorage" in globalThis)) {
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      }
    },
    configurable: true
  });
}

beforeEach(() => {
  localStorage.clear();
});

describe("knowledge base tree loading", () => {
  it("loads only direct children for each expansion step", () => {
    const rootNodes = listKnowledgeBaseNodes("kb-product");
    expect(rootNodes).toHaveLength(1);
    expect(rootNodes[0]?.title).toBe("方案库");
    expect(rootNodes[0]?.children).toBeUndefined();
    expect(rootNodes[0]?.isExpandable).toBe(true);

    const levelOneNodes = listKnowledgeBaseNodes("kb-product", "product-library");
    expect(levelOneNodes.map((node) => node.title)).toEqual(["Product Overview", "产品方案总览"]);
    expect(levelOneNodes.every((node) => node.children === undefined)).toBe(true);

    const levelTwoNodes = listKnowledgeBaseNodes("kb-product", "node-doc-product-roadmap");
    expect(levelTwoNodes.map((node) => node.title)).toEqual(["2026 H1 路线图", "需求池"]);
    expect(levelTwoNodes.every((node) => node.children === undefined)).toBe(true);
  });

  it("represents bitable as a non-expandable leaf node", () => {
    const nodes = listKnowledgeBaseNodes("kb-product", "node-doc-product-roadmap");
    const bitableNode = nodes.find((node) => node.kind === "bitable");

    expect(bitableNode).toBeDefined();
    expect(bitableNode?.title).toBe("需求池");
    expect(bitableNode?.hasChildren).toBe(false);
    expect(bitableNode?.isExpandable).toBe(false);
  });

  it("builds a selectable sync scope for bitable leaf nodes", () => {
    const nodes = listKnowledgeBaseNodes("kb-product", "node-doc-product-roadmap");
    const bitableNode = nodes.find((node) => node.kind === "bitable");

    const scope = buildScopeFromNode(bitableNode!);

    expect(scope).toEqual({
      kind: "bitable",
      spaceId: "kb-product",
      spaceName: "产品知识库",
      title: "需求池",
      displayPath: "产品知识库 / 方案库 / 产品方案总览 / 需求池",
      nodeToken: "node-bitable-product-demand-pool",
      documentId: "bitable-product-demand-pool",
      pathSegments: ["方案库", "产品方案总览", "需求池"],
      includesDescendants: false
    });
  });

  it("selects a subtree-capable document without preloading its descendants", () => {
    const nodes = listKnowledgeBaseNodes("kb-product", "product-library");
    const subtreeRoot = nodes.find((node) => node.documentId === "doc-product-roadmap");

    expect(subtreeRoot?.children).toBeUndefined();
    expect(subtreeRoot?.hasChildren).toBe(true);

    const scope = buildScopeFromNode(subtreeRoot!);
    expect(scope?.includesDescendants).toBe(true);

    const selection = toggleSourceSelection([], scope!, true);
    expect(selection.replacedCrossSpaceSelection).toBe(false);
    expect(selection.sources).toEqual([scope]);
  });

  it("creates multi-document task metadata with deduplicated selected sources", () => {
    const nodes = listKnowledgeBaseNodes("kb-eng", "eng-guides");
    const architecture = nodes.find((node) => node.documentId === "doc-eng-architecture");
    const apiOverview = nodes.find((node) => node.documentId === "doc-eng-api");

    expect(architecture?.kind).toBe("document");
    expect(apiOverview?.kind).toBe("document");

    const task = createSyncTask(
      [
        {
          kind: "document",
          spaceId: architecture!.spaceId,
          spaceName: architecture!.spaceName,
          title: architecture!.title,
          displayPath: architecture!.displayPath,
          nodeToken: architecture!.nodeToken,
          documentId: architecture!.documentId,
          pathSegments: architecture!.pathSegments
        },
        {
          kind: "document",
          spaceId: apiOverview!.spaceId,
          spaceName: apiOverview!.spaceName,
          title: apiOverview!.title,
          displayPath: apiOverview!.displayPath,
          nodeToken: apiOverview!.nodeToken,
          documentId: apiOverview!.documentId,
          pathSegments: apiOverview!.pathSegments
        },
        {
          kind: "document",
          spaceId: architecture!.spaceId,
          spaceName: architecture!.spaceName,
          title: architecture!.title,
          displayPath: architecture!.displayPath,
          nodeToken: architecture!.nodeToken,
          documentId: architecture!.documentId,
          pathSegments: architecture!.pathSegments
        }
      ],
      "C:/tmp/sync-target"
    );

    expect(task.selectedSources?.map((source) => source.documentId)).toEqual(["doc-eng-architecture", "doc-eng-api"]);
    expect(task.selectedScope).toBeNull();
    expect(task.selectionSummary?.kind).toBe("multi-document");
    expect(task.selectionSummary?.documentCount).toBe(2);
    expect(task.counters.total).toBe(2);
  });

  it("creates mixed-source task metadata when a folder and a document are selected together", () => {
    const folderNodes = listKnowledgeBaseNodes("kb-product");
    const library = folderNodes[0];
    const docNodes = listKnowledgeBaseNodes("kb-product", "product-library");
    const roadmap = docNodes.find((node) => node.documentId === "doc-product-roadmap");

    expect(library?.kind).toBe("folder");
    expect(roadmap?.kind).toBe("document");

    const task = createSyncTask(
      [
        {
          kind: "folder",
          spaceId: library!.spaceId,
          spaceName: library!.spaceName,
          title: library!.title,
          displayPath: library!.displayPath,
          nodeToken: library!.nodeToken,
          pathSegments: library!.pathSegments
        },
        {
          kind: "document",
          spaceId: roadmap!.spaceId,
          spaceName: roadmap!.spaceName,
          title: roadmap!.title,
          displayPath: roadmap!.displayPath,
          nodeToken: roadmap!.nodeToken,
          documentId: roadmap!.documentId,
          pathSegments: roadmap!.pathSegments,
          includesDescendants: true
        }
      ],
      "C:/tmp/sync-target"
    );

    expect(task.selectedSources).toHaveLength(1);
    expect(task.selectedSources?.[0]?.kind).toBe("folder");
    expect(task.selectionSummary?.kind).toBe("folder");
    expect(task.selectionSummary?.documentCount).toBe(4);
  });

  it("creates folder-root task metadata for a selected library node", () => {
    const library = listKnowledgeBaseNodes("kb-product")[0];

    expect(library?.kind).toBe("folder");

    const task = createSyncTask(
      [
        {
          kind: "folder",
          spaceId: library!.spaceId,
          spaceName: library!.spaceName,
          title: library!.title,
          displayPath: library!.displayPath,
          nodeToken: library!.nodeToken,
          pathSegments: library!.pathSegments
        }
      ],
      "C:/tmp/sync-target"
    );

    expect(task.selectedSources).toHaveLength(1);
    expect(task.selectedSources?.[0]?.nodeToken).toBe("product-library");
    expect(task.selectionSummary?.kind).toBe("folder");
    expect(task.selectionSummary?.documentCount).toBe(4);
    expect(task.selectionSummary?.rootCount).toBe(1);
    expect(task.selectionSummary?.displayPath).toBe("产品知识库 / 方案库");
  });

  it("creates a single-root sync task for a selected bitable leaf", () => {
    const nodes = listKnowledgeBaseNodes("kb-product", "node-doc-product-roadmap");
    const bitableNode = nodes.find((node) => node.kind === "bitable");

    const task = createSyncTask(
      [
        {
          kind: "bitable",
          spaceId: bitableNode!.spaceId,
          spaceName: bitableNode!.spaceName,
          title: bitableNode!.title,
          displayPath: bitableNode!.displayPath,
          nodeToken: bitableNode!.nodeToken,
          documentId: bitableNode!.documentId,
          pathSegments: bitableNode!.pathSegments
        }
      ],
      "C:/tmp/sync-target"
    );

    expect(task.selectedSources?.[0]?.kind).toBe("bitable");
    expect(task.selectedScope?.kind).toBe("bitable");
    expect(task.selectionSummary?.kind).toBe("bitable");
    expect(task.selectionSummary?.documentCount).toBe(1);
    expect(task.counters.total).toBe(1);
  });
});
