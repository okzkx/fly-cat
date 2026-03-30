import { describe, expect, it } from "vitest";
import { buildFeishuBrowserUrl } from "../src/utils/feishuBrowserUrl";

describe("buildFeishuBrowserUrl", () => {
  it("uses documentId for regular document links", () => {
    expect(
      buildFeishuBrowserUrl({
        kind: "document",
        documentId: "doc-real-id",
        nodeToken: "node-doc-token"
      })
    ).toEqual({
      url: "https://feishu.cn/docx/doc-real-id"
    });
  });

  it("uses documentId for subtree-capable document links", () => {
    expect(
      buildFeishuBrowserUrl({
        kind: "document",
        documentId: "doc-product-roadmap",
        nodeToken: "node-doc-product-roadmap"
      })
    ).toEqual({
      url: "https://feishu.cn/docx/doc-product-roadmap"
    });
  });

  it("uses nodeToken for bitable links", () => {
    expect(
      buildFeishuBrowserUrl({
        kind: "bitable",
        nodeToken: "node-bitable-product-demand-pool",
        documentId: "bitable-product-demand-pool"
      })
    ).toEqual({
      url: "https://feishu.cn/base/node-bitable-product-demand-pool"
    });
  });

  it("fails fast when a documentId is missing for document links", () => {
    expect(
      buildFeishuBrowserUrl({
        kind: "document",
        nodeToken: "node-doc-token"
      })
    ).toEqual({
      error: "无效的文档标识"
    });
  });
});
