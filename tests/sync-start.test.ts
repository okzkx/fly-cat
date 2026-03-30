import { describe, expect, it } from "vitest";
import { shouldSkipTaskCreationAfterCleanup } from "../src/utils/syncStart";
import type { SyncScope } from "../src/types/sync";

function makeSource(): SyncScope {
  return {
    kind: "folder",
    spaceId: "space-1",
    spaceName: "Test Space",
    title: "Folder",
    displayPath: "Folder",
    nodeToken: "folder-token",
    pathSegments: []
  };
}

describe("shouldSkipTaskCreationAfterCleanup", () => {
  it("returns true for cleanup-only runs with no explicit selected sources", () => {
    expect(shouldSkipTaskCreationAfterCleanup(["doc-1"], [])).toBe(true);
  });

  it("returns false when cleanup is not needed", () => {
    expect(shouldSkipTaskCreationAfterCleanup([], [])).toBe(false);
  });

  it("returns false when explicit selected sources still exist", () => {
    expect(shouldSkipTaskCreationAfterCleanup(["doc-1"], [makeSource()])).toBe(false);
  });
});
