import { describe, expect, it } from "vitest";
import { mapDocumentPath, mapFolderPath } from "@/services/path-mapper";

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

  it("maps nested folder paths under space matching markdown directory layout", () => {
    const folderPath = mapFolderPath("/sync-root", "研发知识库", "kb-eng", ["研发规范", "子文件夹"]);
    expect(folderPath.replace(/\\/g, "/")).toBe("/sync-root/研发知识库/研发规范/子文件夹");
    const docPath = mapDocumentPath("/sync-root", {
      id: "doc-1",
      spaceId: "kb-eng",
      spaceName: "研发知识库",
      nodeToken: "n1",
      title: "某文档",
      version: "v1",
      updateTime: "t1",
      pathSegments: ["研发规范", "子文件夹", "某文档"],
      sourcePath: ""
    });
    expect(docPath.replace(/\\/g, "/").startsWith(folderPath.replace(/\\/g, "/") + "/")).toBe(true);
  });

  it("sanitizes folder paths consistently with documents", () => {
    const folderPath = mapFolderPath("/sync-root", "研发:知识库", "kb-eng", ["架构|设计", "子目录"]);
    expect(folderPath.replace(/\\/g, "/")).toBe("/sync-root/研发_知识库/架构_设计/子目录");
  });
});
