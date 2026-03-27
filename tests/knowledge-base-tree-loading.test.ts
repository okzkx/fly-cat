import { beforeEach, describe, expect, it } from "vitest";
import { createSyncTask, listKnowledgeBaseNodes } from "../src/utils/browserTaskManager";

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
});
