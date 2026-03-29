import { describe, expect, it } from "vitest";
import {
  collectAllDescendantKeys,
  computeCascadedCheckedKeys,
  computeTriState
} from "../src/utils/treeSelection";
import type { KnowledgeBaseNode } from "../src/types/sync";

function makeNode(key: string, children?: KnowledgeBaseNode[]): KnowledgeBaseNode {
  return {
    key,
    kind: "folder",
    spaceId: "test-space",
    spaceName: "Test Space",
    title: key,
    displayPath: key,
    nodeToken: `token-${key}`,
    hasChildren: Boolean(children?.length),
    isExpandable: Boolean(children?.length),
    children
  };
}

describe("collectAllDescendantKeys", () => {
  it("returns empty array for a node with no children", () => {
    const tree = [makeNode("root")];
    expect(collectAllDescendantKeys(tree, "root")).toEqual([]);
  });

  it("returns direct children keys", () => {
    const tree = [makeNode("root", [makeNode("child1"), makeNode("child2")])];
    expect(collectAllDescendantKeys(tree, "root")).toEqual(["child1", "child2"]);
  });

  it("returns deeply nested descendant keys", () => {
    const tree = [makeNode("root", [
      makeNode("child1", [makeNode("grandchild1"), makeNode("grandchild2")]),
      makeNode("child2")
    ])];
    expect(collectAllDescendantKeys(tree, "root")).toEqual(["child1", "grandchild1", "grandchild2", "child2"]);
  });

  it("returns empty array when target key is not found", () => {
    const tree = [makeNode("root", [makeNode("child1")])];
    expect(collectAllDescendantKeys(tree, "nonexistent")).toEqual([]);
  });

  it("returns only descendants of the specified node, not siblings", () => {
    const tree = [makeNode("root", [
      makeNode("child1", [makeNode("gc1")]),
      makeNode("child2", [makeNode("gc2")])
    ])];
    expect(collectAllDescendantKeys(tree, "child1")).toEqual(["gc1"]);
  });
});

describe("computeTriState", () => {
  it("returns all-checked when self and all descendants are checked", () => {
    const checkedKeys = new Set(["parent", "child1", "child2"]);
    expect(computeTriState(checkedKeys, "parent", ["child1", "child2"])).toBe("all-checked");
  });

  it("returns none-checked when self and all descendants are unchecked", () => {
    const checkedKeys = new Set<string>();
    expect(computeTriState(checkedKeys, "parent", ["child1", "child2"])).toBe("none-checked");
  });

  it("returns mixed when some descendants are checked", () => {
    const checkedKeys = new Set(["parent", "child1"]);
    expect(computeTriState(checkedKeys, "parent", ["child1", "child2"])).toBe("mixed");
  });

  it("returns mixed when self is checked but not all descendants", () => {
    const checkedKeys = new Set(["parent"]);
    expect(computeTriState(checkedKeys, "parent", ["child1", "child2"])).toBe("mixed");
  });

  it("returns none-checked when only self is not checked and descendants are also not checked", () => {
    const checkedKeys = new Set(["child1"]);
    // Self not checked, but one child is - that's mixed
    expect(computeTriState(checkedKeys, "parent", ["child1", "child2"])).toBe("mixed");
  });
});

describe("computeCascadedCheckedKeys", () => {
  it("from none-checked: checks self and all descendants", () => {
    const current = new Set<string>();
    const result = computeCascadedCheckedKeys(current, "parent", ["child1", "child2"], "none-checked");
    expect(result).toEqual(new Set(["parent", "child1", "child2"]));
  });

  it("from all-checked: unchecks self and all descendants", () => {
    const current = new Set(["parent", "child1", "child2"]);
    const result = computeCascadedCheckedKeys(current, "parent", ["child1", "child2"], "all-checked");
    expect(result).toEqual(new Set());
  });

  it("from mixed: checks self and all descendants", () => {
    const current = new Set(["parent", "child1"]);
    const result = computeCascadedCheckedKeys(current, "parent", ["child1", "child2"], "mixed");
    expect(result).toEqual(new Set(["parent", "child1", "child2"]));
  });

  it("preserves other unrelated checked keys", () => {
    const current = new Set(["parent", "child1", "child2", "unrelated"]);
    const result = computeCascadedCheckedKeys(current, "parent", ["child1", "child2"], "all-checked");
    expect(result).toEqual(new Set(["unrelated"]));
  });

  it("handles node with no descendants (leaf)", () => {
    const current = new Set<string>();
    const result = computeCascadedCheckedKeys(current, "leaf", [], "none-checked");
    expect(result).toEqual(new Set(["leaf"]));
  });
});
