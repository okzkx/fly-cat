import { describe, expect, it } from "vitest";
import { mapDocumentPath } from "@/services/path-mapper";

describe("path mapper", () => {
  it("mirrors knowledge-base-relative directory structure", () => {
    const outputPath = mapDocumentPath("/sync-root", {
      id: "doc-eng-api",
      spaceId: "kb-eng",
      spaceName: "研发知识库",
      nodeToken: "node-doc-eng-api",
      title: "研发API概览",
      version: "v1",
      updateTime: "t1",
      pathSegments: ["研发规范", "研发API概览"],
      sourcePath: "研发知识库/研发规范/研发API概览"
    });

    expect(outputPath.replace(/\\/g, "/")).toBe("/sync-root/研发知识库/研发规范/研发API概览.md");
  });

  it("sanitizes filesystem-hostile characters without flattening names", () => {
    const outputPath = mapDocumentPath("/sync-root", {
      id: "doc-risky",
      spaceId: "kb-eng",
      spaceName: "研发:知识库",
      nodeToken: "node-doc-risky",
      title: "方案/评审*记录",
      version: "v1",
      updateTime: "t1",
      pathSegments: ["架构|设计", "方案/评审*记录"],
      sourcePath: "研发:知识库/架构|设计/方案/评审*记录"
    });

    expect(outputPath.replace(/\\/g, "/")).toBe("/sync-root/研发_知识库/架构_设计/方案_评审_记录.md");
  });
});
