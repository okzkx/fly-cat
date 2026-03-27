import { describe, expect, it } from "vitest";
import type { SyncScope } from "@/types/sync";
import { buildSelectionSummary, dedupeSelectedSources } from "@/utils/syncSelection";

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

describe("sync selection summaries", () => {
  it("prefers subtree-capable document sources when deduplicating", () => {
    const sources = dedupeSelectedSources([
      makeDocumentScope("doc-a", "父文档"),
      makeDocumentScope("doc-a", "父文档", { includesDescendants: true })
    ]);

    expect(sources).toHaveLength(1);
    expect(sources[0]?.includesDescendants).toBe(true);
  });

  it("builds subtree-aware summary for a single selected root", () => {
    const summary = buildSelectionSummary(
      [makeDocumentScope("doc-parent", "父文档", { includesDescendants: true })],
      null,
      { effectiveDocumentCount: 3 }
    );

    expect(summary?.kind).toBe("document");
    expect(summary?.includesDescendants).toBe(true);
    expect(summary?.documentCount).toBe(3);
    expect(summary?.rootCount).toBe(1);
  });

  it("builds subtree-aware multi-root summary with effective document count", () => {
    const summary = buildSelectionSummary(
      [
        makeDocumentScope("doc-parent", "父文档", { includesDescendants: true }),
        makeDocumentScope("doc-leaf", "独立文档")
      ],
      null,
      { effectiveDocumentCount: 4 }
    );

    expect(summary?.kind).toBe("multi-document");
    expect(summary?.includesDescendants).toBe(true);
    expect(summary?.documentCount).toBe(4);
    expect(summary?.rootCount).toBe(2);
    expect(summary?.displayPath).toContain("文档分支");
  });
});
